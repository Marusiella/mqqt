package main

import (
	"fmt"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/google/uuid"
	"github.com/meilisearch/meilisearch-go"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"time"
)

var connectHandler mqtt.OnConnectHandler = func(client mqtt.Client) {
	fmt.Println("Connected")
}

var connectLostHandler mqtt.ConnectionLostHandler = func(client mqtt.Client, err error) {
	fmt.Printf("Connect lost: %v", err)
}
var gpios = []int{15, 5, 18, 19}
var topic = "esp32/gpio"

func main() {
	clientSearch := meilisearch.NewClient(meilisearch.ClientConfig{
		Host:   "http://192.168.1.123:7700",
		APIKey: "MASTER_KEY",
	})
	if _, err := clientSearch.GetIndex("esp32"); err != nil {
		_, err = clientSearch.CreateIndex(&meilisearch.IndexConfig{
			Uid:        "esp32",
			PrimaryKey: "id",
		})
		if err != nil {
			return
		}
	}
	index := clientSearch.Index("esp32")

	typo, err := index.GetTypoTolerance()
	if err != nil {
		panic(err)
	}
	if !typo.Enabled {
		_, err := index.UpdateTypoTolerance(&meilisearch.TypoTolerance{
			Enabled: true,
		})
		if err != nil {
			panic(err)
		}
	}
	var broker = "192.168.1.123"
	var port = 1883
	app := fiber.New()
	app.Use(logger.New())
	opts := mqtt.NewClientOptions()
	opts.AddBroker(fmt.Sprintf("tcp://%s:%d", broker, port))
	opts.SetClientID("dfdf")
	opts.SetUsername("go")
	opts.SetPassword("golang")

	opts.OnConnect = connectHandler
	opts.OnConnectionLost = connectLostHandler
	client := mqtt.NewClient(opts)
	go func() {
		s := client.Subscribe("esp32/message", 0, func(client mqtt.Client, message mqtt.Message) {
			log.Printf("Received message: %s from topic: %s\n", message.Payload(), message.Topic())
		})
		s.Wait()
	}()

	if token := client.Connect(); token.Wait() && token.Error() != nil {
		panic(token.Error())
	}

	api := app.Group("/api")
	api.Get("/list", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"gpios": gpios,
		})
	})
	api.Post("/on", func(ctx *fiber.Ctx) error {
		paramAuto := ctx.Query("auto")
		var id struct{ Gpio string }
		if err := ctx.BodyParser(&id); err != nil {
			return err
		}

		token := client.Publish(topic, 0, false, fmt.Sprintf("%s/%d", id.Gpio, 1))
		token.Wait()
		if paramAuto == "true" {
			go func() {
				time.Sleep(2 * time.Second)
				token := client.Publish(topic, 0, false, fmt.Sprintf("%s/%d", id.Gpio, 0))
				token.Wait()
			}()
		}
		return ctx.JSON(id)
	})
	api.Post("/off", func(ctx *fiber.Ctx) error {
		var id struct{ Gpio int }
		if err := ctx.BodyParser(&id); err != nil {
			return err
		}
		token := client.Publish(topic, 0, false, fmt.Sprintf("%d/%d", id.Gpio, 0))
		token.Wait()
		return ctx.JSON(id)
	})
	api.Post("/search", func(ctx *fiber.Ctx) error {
		var search struct{ Query string }
		if err := ctx.BodyParser(&search); err != nil {
			return err
		}

		result, err := index.Search(search.Query, &meilisearch.SearchRequest{
			Limit: 10,
		})
		if err != nil {
			return err
		}
		return ctx.JSON(result)
	})
	api.Post("/add", func(ctx *fiber.Ctx) error {
		var add struct {
			Gpio string
			Name string
			File *multipart.FileHeader
		}
		add.Gpio = ctx.FormValue("gpio")
		add.Name = ctx.FormValue("name")
		add.File, _ = ctx.FormFile("file")
		ext := filepath.Ext(add.File.Filename)
		uuidFile := uuid.New().String()
		err := ctx.SaveFile(add.File, fmt.Sprintf("./files/%s", uuidFile+ext))
		if err != nil {
			return err
		}
		_, err = index.AddDocuments([]map[string]interface{}{
			{
				"id":   uuid.New().String(),
				"gpio": add.Gpio,
				"name": add.Name,
				"file": uuidFile + ext,
			},
		})
		if err != nil {
			return err
		}
		return ctx.JSON(fiber.Map{
			"gpio": add.Gpio,
			"name": add.Name,
			"file": uuidFile + ext,
		})
	})
	api.Get("/img/:file", func(ctx *fiber.Ctx) error {
		return ctx.SendFile(fmt.Sprintf("./files/%s", ctx.Params("file")))
	})
	api.Get("/typotolerance", func(ctx *fiber.Ctx) error {
		isAutocomplete, err := index.GetTypoTolerance()
		if err != nil {
			return err
		}
		return ctx.JSON(fiber.Map{
			"enabled": isAutocomplete.Enabled,
		})
	})
	api.Post("/typotolerance", func(ctx *fiber.Ctx) error {
		var typo struct{ Enabled bool }
		if err = ctx.BodyParser(&typo); err != nil {
			return err
		}
		_, err = index.UpdateTypoTolerance(&meilisearch.TypoTolerance{
			Enabled: typo.Enabled,
		})
		if err != nil {
			return err
		}
		return ctx.SendStatus(200)
	})
	app.Use(filesystem.New(filesystem.Config{Root: http.Dir("./web/dist")}))

	log.Fatal(app.Listen(":3000"))

}

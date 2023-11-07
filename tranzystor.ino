#include <WiFi.h>
#include <PubSubClient.h>
#include <string>
const char* ssid = "";                //ZMIENIC na swoje
const char* password = "";    //ZMIENIC na swoje
const char* mqtt_server = "";  //ZMIENIC na swoje
const char* deviceName = "ESP32";           //poki co nie trzeba zmieniac
//ale przy wiekszej ilosci urzaden kazde musi miec swoja nazwe

const char* startMessageTopic = "esp32/message";  //temat do wyslania wiadomosci
const char* pinTopic = "esp32/gpio";              //temat do odbioru wiadomosci
const char* username = "golang";              
const char* passwd = "Golang1!";              

WiFiClient espClient;
PubSubClient client(espClient);



void reconnect() {
  bool ctd = false;
  //funkcja jest wywolywana jesli utracono polaczenie z serwerem
  Serial.println("Rozlaczono!");
  while (!ctd) {
    Serial.print("Laczenie z serwerem...");
    if (client.connect(deviceName,username,passwd)) {
      ctd = true;
      Serial.println("Polaczono!");
    } else {
      Serial.print(".");
      delay(1000);
    }
  }
}

void odbiorWiadomosci(String temat, byte* zawartosc, unsigned int dlugosc)
{
  std::string pomoc;
  Serial.println("Odebrano wiadomosc:");
  Serial.print("\tTemat: ");
  Serial.println(temat);
  Serial.print("\tTresc: \"");
  for(int i=0; i<dlugosc; i++) 
  {
    Serial.print((char)zawartosc[i]);
    pomoc += (char)zawartosc[i];
  }
  Serial.println("\"");

  if(temat == pinTopic)
  {
    int location = pomoc.find_first_of("/");
    std::string gpi = pomoc.substr(0,location).c_str();
    std::string onoff = pomoc.substr(location+1).c_str();
    int gpi_number = std::stoi(gpi);
    int onoff_number = std::stoi(onoff);
    digitalWrite(gpi_number, onoff_number);
  }
}
void setup() {
  Serial.begin(115200);

  // put your setup code here, to run once:
  pinMode(15, OUTPUT);
  pinMode(5, OUTPUT);
  pinMode(18, OUTPUT);
  pinMode(19, OUTPUT);
  ustawienieWifi();  //polaczenie z wifi
  delay(1000);
  client.setServer(mqtt_server, 1883); //ustawienie serwera  mqtt
  client.connect(deviceName,username,passwd); //polaczenie z podana nazwa
  client.subscribe(pinTopic); //ustawienie nasluchiwania w podanym temacie
  client.setCallback(odbiorWiadomosci); //ustawienie funkcji do odbioru wiadomosci
  client.publish(startMessageTopic, "Hello from ESP32"); //wyslanie pierwszej wiadomosci
}
void ustawienieWifi() {
  delay(10);
  Serial.println();
  Serial.print("Laczenie z ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Polaczona z wifi.\nESP otrzymalo adres IP: ");
  Serial.println(WiFi.localIP());
}
void loop() {
  if (!client.connected()) //jesli klient zostal rozlaczony
  {
   reconnect(); //polacz ponownie
   client.publish(startMessageTopic, "Hello from ESP32"); //wysliij wiadomoc powitalna
  }
  if(!client.loop())
    client.connect(deviceName); //upewnienie sie, ze klient jest stale podlaczony
}

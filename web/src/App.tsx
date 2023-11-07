import './App.css'
import useSWRMutation from "swr/mutation";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from './components/ui/dialog';
import useSWR from "swr";
import {fetcher} from "@/fetcher.ts";
import * as z from "zod"
// @ts-ignore
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {useState} from "react";
import {columns, DataTable} from "@/datatable.tsx";
import {Settings2} from "lucide-react";
import {Link} from "react-router-dom";

export interface Search {
    hits: Hit[];
    estimatedTotalHits: number;
    limit: number;
    processingTimeMs: number;
    query: string;
}

export interface Hit {
    gpio: string;
    id: string;
    name: string;
    file?: string;
}

const formSchema = z.object({
    name: z.string().min(3),
    drawer_id: z.string(),
})


async function sendRequestSearch(url: string, {arg}: { arg: { query: string } }) {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(arg),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
}

async function sendRequestAdd(url: string, {arg}: { arg: { gpio: string, name: string, file: File | null } }) {
    const formData = new FormData();
    if (arg.file) {
        formData.append('file', arg.file);
    }
    formData.append('gpio', arg.gpio);
    formData.append('name', arg.name);

    return fetch(url, {
        method: 'POST',
        body: formData,
    }).then(res => res.json())
}


function App() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            drawer_id: '',
        },
        //     file

    })


    const {data} = useSWR<{ gpios: string[] }>('/api/list', fetcher)
    const {
        data: dataSearch,
        trigger: triggerSearch,
    } = useSWRMutation('/api/search', sendRequestSearch)
    const {trigger: triggerAdd, isMutating: isMutatingAdd} = useSWRMutation('/api/add', sendRequestAdd)
    const [file, setFile] = useState<File | null>(null)

    function onSubmit(values: z.infer<typeof formSchema>) {
        triggerAdd({gpio: values.drawer_id, name: values.name, file: file}).then(r => console.log(r))
        setFile(null)
    }

    return (
        <main className="p-24 bg-neutral-100 w-full min-h-screen text-black">
            <div className="flex">
                <Input className="text-black " type="text"
                          placeholder="Search..."

                       onInput={(e) => triggerSearch({query: e.currentTarget.value})}/>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="ml-4">Add Item</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add item to db</DialogTitle>
                            <DialogDescription>
                                Your item will be added to the database.
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({field}: any) => (
                                        <FormItem>
                                            <FormLabel>Item name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Esp32" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                This is your public display name.
                                            </FormDescription>
                                            <FormMessage/>
                                        </FormItem>
                                    )}/>
                                <FormField
                                    control={form.control}
                                    name="drawer_id"
                                    render={({field}: any) => (
                                        <FormItem>
                                            <FormLabel>Box</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a verified email to display"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {data?.gpios.map((e, i) => <SelectItem key={i}
                                                                                           value={e.toString()}>{e.toString()}</SelectItem>)}
                                                </SelectContent>

                                            </Select>
                                            <FormDescription>
                                                This is your box id.
                                            </FormDescription>
                                            <FormMessage/>
                                        </FormItem>
                                    )}/>
                                <Input accept=".jpg, .jpeg, .png, .svg, .gif"
                                       type="file"
                                       onChange={(e) => {
                                           const file = e.currentTarget.files?.[0];
                                           if (file) {
                                               setFile(file);
                                           }

                                       }

                                       }

                                />

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="submit" disabled={isMutatingAdd}>Save changes</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Button asChild className="ml-4" variant="outline">
                    <Link to="/admin">
                        <Settings2/>
                    </Link>
                </Button>
            </div>
            {/*{(dataSearch as Search)?.hits.map(e => <div className="p-6 my-4 flex justify-around"*/}
            {/*                                            key={e.id}>{e.file &&*/}
            {/*    <img src={`/api/img/${e.file}`} width={100} height={100} alt="image"/>}<h2>{e.name}</h2>*/}
            {/*    <button className="px-4 py-2 bg-neutral-900 text-white rounded font-bold"*/}
            {/*            onClick={() => triggerOn({gpio: e.gpio, auto: true})}*/}
            {/*            disabled={isMutatingOn}>{SZAFKI.indexOf(Number(e.gpio)) + 1}</button>*/}
            {/*</div>)}*/}
            <div className="mt-4">
                <DataTable  columns={columns} data={dataSearch?.hits || []}/>

            </div>
        </main>
    )
}

export default App

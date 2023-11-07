import {ColumnDef, flexRender, getCoreRowModel, useReactTable,} from "@tanstack/react-table"

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {Hit} from "@/App.tsx";
import {Button} from "@/components/ui/button.tsx";

const SZAFKI = [15, 5, 18, 19];

async function sendRequestGpio(url: string, arg: { gpio: string, auto: boolean }) {
    return fetch(url + (arg.auto ? "?auto=true" : ""), {
        method: 'POST',
        body: JSON.stringify({gpio: arg.gpio}),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
}

export const columns: ColumnDef<Hit>[] = [
    {
        header: 'Name',
        accessorKey: 'name',
    },
    {
        header: 'Image',
        accessorKey: 'file',
        cell: (value) => value.getValue() &&
            <img src={`/api/img/${value.getValue()}`} className="aspect-auto max-h-20 mix-blend-darken" alt="image"/>
    },
    {
        header: 'Box',
        accessorKey: 'gpio',
        cell: (value) => <Button variant="outline"
                                 onClick={() => sendRequestGpio("/api/on", {
                                     gpio: value.getValue() as string,
                                     auto: true
                                 })}
        >{SZAFKI.indexOf(Number(value.getValue())) + 1}</Button>
    }
]

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

export function DataTable<TData, TValue>({
                                             columns,
                                             data,
                                         }: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
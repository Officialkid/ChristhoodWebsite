"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3 } from "lucide-react";
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState, type VisibilityState } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { btnClass } from "../ui";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** What the column is called in the column menu and the phone sort list (headers can be icons or empty). */
    label?: string;
    /** The first cell of a phone entry's second line is shown with this class: `k` puts the cell on line one beside the name. */
    className?: string;
    /** A column people may switch off. The first column never can. */
    hideable?: boolean;
  }
}

/**
 * A sortable, pageable table for records. Filtering is done by the screen (it knows its own filters), which hands over
 * the rows to show. Sorting, paging and which columns appear are handled here. Each row's main cell holds the control that
 * opens it (a button or link with class `a-go`, which spreads over the whole row), so the keyboard and screen readers get one clear stop per row.
 */
export function DataTable<T>({
  data, columns, getRowId, caption, unit, initialSort, initialHidden, pageSize = 25, empty,
}: {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  getRowId: (row: T) => string;
  caption: string;
  unit: [singular: string, plural: string];
  initialSort?: SortingState;
  initialHidden?: VisibilityState;
  pageSize?: number;
  empty: React.ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSort ?? []);
  const [hidden, setHidden] = useState<VisibilityState>(initialHidden ?? {});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting, columnVisibility: hidden, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setHidden,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const total = data.length;
  const rows = table.getRowModel().rows;
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(total, from + rows.length - (total === 0 ? 0 : 1));
  const sortable = table.getAllLeafColumns().filter((c) => c.getCanSort());
  const hideable = table.getAllLeafColumns().filter((c) => c.columnDef.meta?.hideable);
  const word = (n: number) => (n === 1 ? unit[0] : unit[1]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-[0.9rem] text-muted" aria-live="polite">{total === 0 ? `No ${unit[1]}` : `${total} ${word(total)}`}</p>
        <div className="flex flex-wrap items-center gap-2">
          {sortable.length > 0 && (
            <label className="flex items-center gap-2 text-[0.88rem] text-muted md:hidden">
              Sort
              <select
                className="f-input !mt-0 !min-h-10 !w-auto"
                value={sorting[0] ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}` : ""}
                onChange={(e) => {
                  const [id, dir] = e.target.value.split(":");
                  setSorting(id ? [{ id, desc: dir === "desc" }] : []);
                }}
              >
                <option value="">Default</option>
                {sortable.flatMap((c) => {
                  const l = c.columnDef.meta?.label ?? c.id;
                  return [<option key={`${c.id}a`} value={`${c.id}:asc`}>{l}, A to Z</option>, <option key={`${c.id}d`} value={`${c.id}:desc`}>{l}, Z to A</option>];
                })}
              </select>
            </label>
          )}
          {hideable.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(btnClass.secondary, "min-h-10")}><Columns3 className="size-4" aria-hidden /> Columns</DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                {hideable.map((c) => (
                  <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(Boolean(v))}>{c.columnDef.meta?.label ?? c.id}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {total === 0 ? (
        empty
      ) : (
        <>
          <table className="a-table" data-labelled="">
            <caption className="sr-only">{caption}</caption>
            <thead>
              {table.getHeaderGroups().map((g) => (
                <tr key={g.id}>
                  {g.headers.map((h) => {
                    const sorted = h.column.getIsSorted();
                    const label = h.column.columnDef.meta?.label ?? String(h.column.columnDef.header ?? "");
                    return (
                      <th key={h.id} scope="col" aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : h.column.getCanSort() ? "none" : undefined}>
                        {h.column.getCanSort() ? (
                          <button type="button" onClick={h.column.getToggleSortingHandler()} className="-mx-1 inline-flex min-h-8 items-center gap-1.5 rounded-sm px-1 font-[inherit] text-inherit hover:text-ink pointer-coarse:min-h-11" aria-label={`${label}, sort ${sorted === "asc" ? "descending" : "ascending"}`}>
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {sorted === "asc" ? <ArrowUp className="size-3.5" aria-hidden /> : sorted === "desc" ? <ArrowDown className="size-3.5" aria-hidden /> : <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />}
                          </button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {r.getVisibleCells().map((c, i) => (
                    <td key={c.id} data-label={i === 0 ? undefined : c.column.columnDef.meta?.label} className={c.column.columnDef.meta?.className}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {total > 10 && (
            <nav aria-label={`${caption} pages`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[0.9rem] text-muted">
              <p>{from}–{to} of {total}</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2">
                  Per page
                  <select className="f-input !mt-0 !min-h-10 !w-auto" value={pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                    {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <button type="button" className={cn(btnClass.secondary, "min-h-10")} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><ChevronLeft className="size-4" aria-hidden /> Previous</button>
                <span aria-current="page">Page {pagination.pageIndex + 1} of {table.getPageCount()}</span>
                <button type="button" className={cn(btnClass.secondary, "min-h-10")} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next <ChevronRight className="size-4" aria-hidden /></button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

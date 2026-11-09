"use client";

import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";

const STATUS_COLUMNS = new Set([
    "advisory",
    "active",
    "approvalstatus",
    "condition",
    "defects",
    "documentation",
    "environment",
    "inspectionresult",
    "isactive",
    "onboarding",
    "safe",
    "safety",
    "status",
    "ppe",
    "vehicleresult",
    "vehiclecondition",
    "workplace",
    "workingatheight",
]);

function normalizedKey(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getStatusTone(value: string) {
    const status = value.trim().toLowerCase().replace(/[_-]+/g, " ");

    if (/^(approved|complete|completed|closed|good|live|new|pass|passed|published|safe|satisfactory|success|yes)$/.test(status)) return "success";
    if (/^(action required|average|draft|in progress|not started|poor|requires attention|returned|review due|review required|under investigation)$/.test(status)) return "warning";
    if (/^(dangerous|failed|inactive|no|rejected|unsafe|unsatisfactory|very poor|overdue)$/.test(status)) return "danger";
    if (/^(in review|open|pending|submitted)$/.test(status)) return "info";
    return "neutral";
}

function StatusBadge({ value }: { value: unknown }) {
    const text = String(value ?? "");
    return <span className={`admin-status-badge is-${getStatusTone(text)}`}>{text}</span>;
}

export type AdminDataTableProps<TData> = {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    emptyMessage?: string;
    searchPlaceholder?: string;
    statusField?: string;
    statusLabel?: string;
};

export default function AdminDataTable<TData>({
    data,
    columns,
    emptyMessage = "No records found.",
    searchPlaceholder = "Search records",
    statusField,
    statusLabel = "All statuses",
}: AdminDataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState(statusLabel);

    const statusOptions = useMemo(() => {
        if (!statusField) return [];
        return Array.from(new Set(data.map((row) => {
            const value = (row as Record<string, unknown>)[statusField];
            return typeof value === "string" ? value : "";
        }).filter(Boolean)));
    }, [data, statusField]);

    const filteredData = useMemo(() => {
        if (!statusField || statusFilter === statusLabel) return data;
        return data.filter((row) => (row as Record<string, unknown>)[statusField] === statusFilter);
    }, [data, statusField, statusFilter, statusLabel]);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: (row, _columnId, filterValue) => {
            const normalized = String(filterValue).trim().toLowerCase();
            if (!normalized) return true;
            return Object.values(row.original as Record<string, unknown>).some((value) =>
                String(value ?? "").toLowerCase().includes(normalized)
            );
        },
        initialState: { pagination: { pageSize: 10 } },
    });

    const pageCount = table.getPageCount();
    const currentPage = pageCount ? table.getState().pagination.pageIndex + 1 : 0;

    return (
        <div className="admin-data-table-shell">
            <div className="admin-data-table-toolbar">
                <label className="admin-data-table-search">
                    <FiSearch aria-hidden="true" />
                    <span className="visually-hidden">Search records</span>
                    <input
                        type="search"
                        value={globalFilter}
                        placeholder={searchPlaceholder}
                        onChange={(event) => setGlobalFilter(event.currentTarget.value)}
                    />
                </label>

                {statusField && statusOptions.length > 0 ? (
                    <label className="admin-data-table-filter">
                        <span className="visually-hidden">Filter records</span>
                        <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.currentTarget.value)}>
                            <option>{statusLabel}</option>
                            {statusOptions.map((status) => <option key={status}>{status}</option>)}
                        </select>
                    </label>
                ) : null}

                <span className="admin-data-table-count">
                    {table.getFilteredRowModel().rows.length} of {data.length} records
                </span>
            </div>

            <div className="admin-data-table">
                <table>
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const canSort = header.column.getCanSort();
                                    const sorted = header.column.getIsSorted();
                                    return (
                                        <th key={header.id} scope="col">
                                            {header.isPlaceholder ? null : canSort ? (
                                                <button
                                                    type="button"
                                                    className="admin-table-sort-button"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                                                >
                                                    <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                                    <span className="admin-table-sort-icon">{sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "↕"}</span>
                                                </button>
                                            ) : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => {
                                    const columnKey = normalizedKey(cell.column.id);
                                    const configuredStatusKey = statusField ? normalizedKey(statusField) : "";
                                    const value = cell.getValue();
                                    const isStatusColumn = columnKey === configuredStatusKey || STATUS_COLUMNS.has(columnKey);
                                    const canShowStatus = isStatusColumn && value !== undefined && value !== null && value !== "" && ["string", "number", "boolean"].includes(typeof value);

                                    return (
                                        <td key={cell.id}>
                                            {canShowStatus ? <StatusBadge value={value} /> : flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {table.getRowModel().rows.length === 0 ? (
                            <tr><td className="admin-data-table-empty" colSpan={columns.length}>{emptyMessage}</td></tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            <div className="admin-data-table-pagination">
                <label>
                    Rows per page
                    <select
                        value={table.getState().pagination.pageSize}
                        onChange={(event) => table.setPageSize(Number(event.currentTarget.value))}
                    >
                        {[10, 25, 50].map((pageSize) => <option key={pageSize} value={pageSize}>{pageSize}</option>)}
                    </select>
                </label>
                <span>Page {currentPage} of {pageCount}</span>
                <div className="admin-data-table-pagination-actions">
                    <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Previous
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

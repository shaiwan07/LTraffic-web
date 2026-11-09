"use client";

import { fetchAdminApi } from "@/app/admin/admin-api";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminDataTable from "@/components/tables/AdminDataTable";

export type EmployeeApiColumn = {
    label: string;
    field: string;
    aliases?: string[];
    type?: "image" | "link" | "pdf";
    hrefField?: string;
    hrefAliases?: string[];
    hrefTemplate?: string;
};

export type EmployeeApiSectionConfig = {
    title: string;
    endpoint: string;
    columns?: EmployeeApiColumn[];
};

type EmployeeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractRecords(payload: unknown): EmployeeRecord[] {
    if (!isRecord(payload)) return [];
    const data = payload.data;
    const nestedData = isRecord(data) ? data : {};
    const candidates = [
        nestedData.records,
        nestedData.items,
        nestedData.results,
        nestedData.list,
        ...Object.values(nestedData),
        Array.isArray(data) ? data : undefined,
        payload.records,
        payload.items,
        payload.results,
        ...Object.values(payload),
    ];
    const records = candidates.find(Array.isArray);
    return Array.isArray(records) ? records.filter(isRecord) : [];
}

function labelFor(field: string) {
    return field
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function valueFor(record: EmployeeRecord, field: string, aliases: string[] = []) {
    for (const key of [field, ...aliases]) {
        const value = record[key];
        if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
}

function legacyImageUrl(value: string) {
    try {
        return new URL(value, "https://ltraffic.co.uk/employeesarea/").toString();
    } catch {
        return value;
    }
}

function renderValue(field: string, value: unknown) {
    if (value === undefined || value === null || value === "") {
        return <span className="admin-workspace-empty-value">—</span>;
    }
    if (typeof value === "string" && /^https?:\/\//i.test(value) && /(url|file|image|photo|document)/i.test(field)) {
        return <a href={value} target="_blank" rel="noopener noreferrer">Open</a>;
    }
    if (Array.isArray(value)) {
        return value.map((item) => isRecord(item) ? JSON.stringify(item) : String(item ?? "")).filter(Boolean).join(", ");
    }
    if (isRecord(value)) return JSON.stringify(value);
    return String(value);
}

function renderConfiguredValue(column: EmployeeApiColumn, record: EmployeeRecord) {
    const value = valueFor(record, column.field, column.aliases);
    const text = value === undefined ? "" : String(value);

    if (column.type === "image" && text) {
        const person = String(record.name ?? record.employeesname ?? "Employee");
        return <Image src={legacyImageUrl(text)} alt={`${person} photo`} width={40} height={40} className="admin-employee-photo" />;
    }

    if (column.type === "pdf" && column.hrefTemplate) {
        const id = String(record.id ?? "");
        const href = column.hrefTemplate.replace("{id}", encodeURIComponent(id));
        return <a className="admin-pdf-report-link" href={href} target="_blank" rel="noopener noreferrer">{text || "PDF Report"}</a>;
    }

    if (column.type === "link") {
        const href = column.hrefTemplate?.replace("{id}", encodeURIComponent(String(record.id ?? "")))
            ?? (column.hrefField ? valueFor(record, column.hrefField, column.hrefAliases) : value);
        if (href) return <a href={String(href)} target="_blank" rel="noopener noreferrer">{text || "Open"}</a>;
        return <span className="admin-workspace-empty-value">—</span>;
    }

    return renderValue(column.field, value);
}

function EmployeeApiSection({ section }: { section: EmployeeApiSectionConfig }) {
    const [records, setRecords] = useState<EmployeeRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        let isActive = true;

        void (async () => {
            setIsLoading(true);
            setError("");
            try {
                const response = await fetchAdminApi(section.endpoint, { cache: "no-store", signal: controller.signal });
                const payload = await response.json().catch(() => null);
                if (!response.ok || (isRecord(payload) && payload.success === false)) {
                    const error = isRecord(payload) && isRecord(payload.error) ? payload.error.message : undefined;
                    throw new Error(typeof error === "string" ? error : `Request failed (${response.status}).`);
                }
                if (isActive) setRecords(extractRecords(payload));
            } catch (requestError) {
                if (isActive && !(requestError instanceof DOMException && requestError.name === "AbortError")) {
                    setError(requestError instanceof Error ? requestError.message : "Unable to load records.");
                }
            } finally {
                if (isActive) setIsLoading(false);
            }
        })();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [section.endpoint]);

    const columns = useMemo<ColumnDef<EmployeeRecord, unknown>[]>(() => {
        const configuredColumns: EmployeeApiColumn[] = section.columns ?? Array.from(new Set(records.flatMap((record) => Object.keys(record))))
            .map((field) => ({ field, label: labelFor(field) }));
        return configuredColumns.map((column) => ({
            id: column.field,
            accessorFn: (record) => valueFor(record, column.field, column.aliases),
            header: column.label,
            cell: ({ getValue, row }) => column.type
                ? renderConfiguredValue(column, row.original)
                : renderValue(column.field, getValue()),
        }));
    }, [records, section.columns]);

    return (
        <section className="admin-api-section" aria-labelledby={`employee-api-${section.endpoint.replace(/[^a-z0-9]+/gi, "-")}`}>
            <h2 id={`employee-api-${section.endpoint.replace(/[^a-z0-9]+/gi, "-")}`}>{section.title}</h2>
            {isLoading ? <p role="status">Loading records…</p> : null}
            {!isLoading && error ? <p className="admin-workspace-notice" role="alert">{error}</p> : null}
            {!isLoading && !error ? (
                <AdminDataTable
                    columns={columns}
                    data={records}
                    searchPlaceholder="Search records"
                    emptyMessage="No records found."
                />
            ) : null}
        </section>
    );
}

export default function EmployeeApiWorkspace({
    title,
    description,
    sections,
}: {
    title: string;
    description: string;
    sections: EmployeeApiSectionConfig[];
}) {
    return (
        <section className="admin-workspace-page">
            <AdminPageHeading title={title} description={description} />
            {sections.map((section) => <EmployeeApiSection key={section.endpoint} section={section} />)}
        </section>
    );
}
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { FiDownload, FiEye, FiFileText, FiPlus, FiSearch, FiSettings, FiTrash2, FiX } from "react-icons/fi";
import type { AdminField, AdminRecord, AdminWorkspaceConfig } from "./admin-workspace-config";

type DialogMode = "view" | "edit" | "create";

type DialogState = {
    mode: DialogMode;
    record: AdminRecord;
} | null;

function newId(records: AdminRecord[], prefix: string) {
    const highest = records.reduce((max, record) => {
        const number = Number(record.id.match(/\d+$/)?.[0] ?? 0);
        return Math.max(max, number);
    }, 0);
    return `${prefix.toUpperCase()}-${String(highest + 1).padStart(3, "0")}`;
}

function FieldInput({
    field,
    value,
    onChange,
}: {
    field: AdminField;
    value: string;
    onChange: (value: string) => void;
}) {
    const id = `admin-field-${field.name}`;
    if (field.type === "textarea") {
        return <textarea id={id} className="form-control" rows={3} value={value} required={field.required} onChange={(event) => onChange(event.currentTarget.value)} />;
    }

    if (field.type === "select") {
        return (
            <select id={id} className="form-select" value={value} required={field.required} onChange={(event) => onChange(event.currentTarget.value)}>
                <option value="">Choose an option</option>
                {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
        );
    }

    return (
        <input
            id={id}
            className="form-control"
            type={field.type ?? "text"}
            value={value}
            required={field.required}
            min={field.type === "number" ? "0" : undefined}
            step={field.type === "number" ? "0.25" : undefined}
            onChange={(event) => onChange(event.currentTarget.value)}
        />
    );
}

export default function AdminWorkspace({ config }: { config: AdminWorkspaceConfig }) {
    const [records, setRecords] = useState(config.initialRecords);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All statuses");
    const [dialog, setDialog] = useState<DialogState>(null);
    const [pdfRecord, setPdfRecord] = useState<AdminRecord | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState("");

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            try {
                const saved = localStorage.getItem(`ltraffic-admin-${config.key}`);
                if (saved) {
                    const parsed = JSON.parse(saved) as AdminRecord[];
                    if (Array.isArray(parsed)) setRecords(parsed);
                }
            } catch {
                setNotice("Saved demo data could not be loaded. Changes will remain for this session only.");
            }
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [config.key]);

    const statusOptions = useMemo(() => {
        if (!config.statusField) return [];
        return Array.from(new Set(records.map((record) => record[config.statusField!] ?? "").filter(Boolean)));
    }, [config.statusField, records]);

    const filteredRecords = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return records.filter((record) => {
            const matchesQuery = !normalizedQuery || config.columns.some(({ field }) => (record[field] ?? "").toLowerCase().includes(normalizedQuery));
            const matchesStatus = statusFilter === "All statuses" || record[config.statusField ?? ""] === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [config.columns, config.statusField, query, records, statusFilter]);

    function saveRecords(nextRecords: AdminRecord[]) {
        setRecords(nextRecords);
        try {
            localStorage.setItem(`ltraffic-admin-${config.key}`, JSON.stringify(nextRecords));
        } catch {
            setNotice("Browser storage is unavailable. Changes will not persist after leaving this page.");
        }
    }

    function openDialog(mode: DialogMode, record?: AdminRecord) {
        const nextRecord = record ?? Object.fromEntries(config.fields.map(({ name }) => [name, ""])) as AdminRecord;
        setFormValues({ ...nextRecord });
        setDialog({ mode, record: nextRecord });
        setNotice("");
    }

    function closeDialog() {
        setDialog(null);
        setFormValues({});
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!dialog) return;
        const record = { ...formValues, id: dialog.mode === "edit" ? dialog.record.id : newId(records, config.key) } as AdminRecord;
        const nextRecords = dialog.mode === "edit"
            ? records.map((current) => current.id === dialog.record.id ? record : current)
            : [record, ...records];
        saveRecords(nextRecords);
        closeDialog();
        setNotice(dialog.mode === "edit" ? "Record updated." : "Record added.");
    }

    function handleDelete(record: AdminRecord) {
        if (!window.confirm(`Delete ${record.id}? This only removes the local demo record.`)) return;
        saveRecords(records.filter((current) => current.id !== record.id));
        setNotice("Record deleted from this browser.");
    }

    return (
        <section className="admin-workspace-page">
            <div className="admin-page-heading">
                <div>
                    <span className="admin-eyebrow">Admin workspace</span>
                    <h1>{config.title}</h1>
                    <p>{config.description}</p>
                </div>
                {config.createHref ? (
                    <Link className="btn btn-primary admin-workspace-add" href={config.createHref}>
                        <FiPlus aria-hidden="true" /> New incident
                    </Link>
                ) : (
                    <button className="btn btn-primary admin-workspace-add" type="button" onClick={() => openDialog("create")}>
                        <FiPlus aria-hidden="true" /> Add record
                    </button>
                )}
            </div>

            <div className="admin-workspace-toolbar">
                <label className="admin-workspace-search">
                    <FiSearch aria-hidden="true" />
                    <span className="visually-hidden">Search records</span>
                    <input type="search" value={query} placeholder="Search records" onChange={(event) => setQuery(event.currentTarget.value)} />
                </label>
                {config.statusField && (
                    <label className="admin-workspace-status-filter">
                        <span className="visually-hidden">Filter by status</span>
                        <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.currentTarget.value)}>
                            <option>All statuses</option>
                            {statusOptions.map((status) => <option key={status}>{status}</option>)}
                        </select>
                    </label>
                )}
                <span className="admin-workspace-count">{filteredRecords.length} of {records.length} records</span>
            </div>

            {notice && <p className="admin-workspace-notice" role="status">{notice}</p>}

            <div className="admin-workspace-table-wrap">
                <table className="table admin-workspace-table">
                    <thead>
                        <tr>
                            {config.columns.map(({ field, label }) => <th scope="col" key={field}>{label}</th>)}
                            <th scope="col" className="admin-workspace-actions-heading">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((record) => (
                            <tr key={record.id}>
                                {config.columns.map(({ field }) => (
                                    <td key={field}>{record[field] || <span className="admin-workspace-empty-value">—</span>}</td>
                                ))}
                                <td>
                                    <div className="admin-workspace-actions">
                                        <button type="button" title="View details" aria-label={`View ${record.id}`} onClick={() => openDialog("view", record)}><FiEye aria-hidden="true" /></button>
                                        <button type="button" title="Edit record" aria-label={`Edit ${record.id}`} onClick={() => openDialog("edit", record)}><FiFileText aria-hidden="true" /></button>
                                        <button type="button" title="Delete record" aria-label={`Delete ${record.id}`} onClick={() => handleDelete(record)}><FiTrash2 aria-hidden="true" /></button>
                                        {config.pdfLabel && <button type="button" title="Preview / print PDF" aria-label={`View PDF for ${record.id}`} onClick={() => setPdfRecord(record)}><FiDownload aria-hidden="true" /></button>}
                                        {config.relatedHref && <Link className="admin-workspace-action-link" title="Maintenance history" aria-label={`Maintenance history for ${record.id}`} href={config.relatedHref}><FiSettings aria-hidden="true" /></Link>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredRecords.length === 0 && (
                            <tr><td className="admin-workspace-no-results" colSpan={config.columns.length + 1}>No records match this search.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <p className="admin-workspace-footnote">Demo data is stored only in this browser. Changes are not sent to the legacy LTraffic system.</p>

            {pdfRecord && (
                <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPdfRecord(null); }}>
                    <section className="admin-record-dialog admin-pdf-preview" role="dialog" aria-modal="true" aria-labelledby="admin-pdf-preview-title">
                        <header className="admin-record-dialog-header admin-pdf-preview-tools">
                            <div>
                                <span className="admin-eyebrow">PDF preview · {pdfRecord.id}</span>
                                <h2 id="admin-pdf-preview-title">{config.pdfLabel ?? config.title}</h2>
                            </div>
                            <div className="admin-pdf-preview-actions">
                                <button className="btn btn-primary" type="button" onClick={() => window.print()}><FiDownload aria-hidden="true" /> Print / Save PDF</button>
                                <button type="button" className="admin-record-dialog-close" aria-label="Close PDF preview" onClick={() => setPdfRecord(null)}><FiX aria-hidden="true" /></button>
                            </div>
                        </header>
                        <article className="admin-pdf-document">
                            <div className="admin-pdf-document-heading">
                                <span>LTraffic · Admin record</span>
                                <h1>{config.pdfLabel ?? config.title}</h1>
                                <p>Record {pdfRecord.id}</p>
                            </div>
                            <dl>
                                {config.fields.map(({ name, label }) => (
                                    <div key={name}>
                                        <dt>{label}</dt>
                                        <dd>{pdfRecord[name] || "—"}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="admin-pdf-demo-note">Generated from local demo data. This is not an official LTraffic record.</p>
                        </article>
                    </section>
                </div>
            )}

            {dialog && (
                <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
                    <section className="admin-record-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-record-dialog-title">
                        <header className="admin-record-dialog-header">
                            <div>
                                <span className="admin-eyebrow">{dialog.mode === "create" ? "New record" : dialog.record.id}</span>
                                <h2 id="admin-record-dialog-title">{dialog.mode === "view" ? "Record details" : dialog.mode === "edit" ? "Edit record" : `Add ${config.title.toLowerCase()} record`}</h2>
                            </div>
                            <button type="button" className="admin-record-dialog-close" aria-label="Close dialog" onClick={closeDialog}><FiX aria-hidden="true" /></button>
                        </header>
                        {dialog.mode === "view" ? (
                            <div className="admin-record-details">
                                {config.fields.map((field) => (
                                    <div key={field.name}>
                                        <span>{field.label}</span>
                                        <p>{dialog.record[field.name] || "—"}</p>
                                    </div>
                                ))}
                                <button className="btn btn-primary" type="button" onClick={() => setPdfRecord(dialog.record)}>View / print PDF</button>
                            </div>
                        ) : (
                            <form className="admin-record-form" onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    {config.fields.map((field) => (
                                        <div className={field.type === "textarea" ? "col-12" : "col-12 col-md-6"} key={field.name}>
                                            <label className="form-label" htmlFor={`admin-field-${field.name}`}>{field.label}{field.required && <span className="admin-field-required">Required</span>}</label>
                                            <FieldInput field={field} value={formValues[field.name] ?? ""} onChange={(value) => setFormValues((current) => ({ ...current, [field.name]: value }))} />
                                        </div>
                                    ))}
                                </div>
                                <div className="admin-record-form-actions">
                                    <button className="btn btn-outline-secondary" type="button" onClick={closeDialog}>Cancel</button>
                                    <button className="btn btn-primary" type="submit">{dialog.mode === "edit" ? "Save changes" : "Add record"}</button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </section>
    );
}
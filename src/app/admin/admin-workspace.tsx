"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import Link from "next/link";
import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { FiDownload, FiEye, FiFileText, FiPlus, FiSettings, FiTrash2, FiX } from "react-icons/fi";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminTableActions, { type AdminTableAction } from "@/components/admin/AdminTableActions";
import AdminDataTable from "@/components/tables/AdminDataTable";
import { fetchAdminApi } from "./admin-api";
import type { AdminField, AdminRecord, AdminWorkspaceConfig } from "./admin-workspace-config";
import { AdminRoleContext } from "./admin-role";

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
    register,
    errors,
}: {
    field: AdminField;
    register: UseFormRegister<Record<string, string>>;
    errors: FieldErrors<Record<string, string>>;
}) {
    const id = `admin-field-${field.name}`;
    const error = errors[field.name]?.message as string | undefined;
    const validation = {
        required: field.required ? `${field.label} is required.` : false,
        ...(field.type === "email" ? { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address." } } : {}),
    };
    const commonProps = {
        id,
        ...register(field.name, validation),
        "aria-invalid": Boolean(error),
        className: `${field.type === "select" ? "form-select" : "form-control"}${error ? " is-invalid" : ""}`,
    };

    return (
        <>
            {field.type === "textarea" ? (
                <textarea {...commonProps} rows={3} />
            ) : field.type === "select" ? (
                <select {...commonProps}>
                    <option value="">Choose an option</option>
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
            ) : (
                <input
                    {...commonProps}
                    type={field.type ?? "text"}
                    min={field.type === "number" ? "0" : undefined}
                    step={field.type === "number" ? "0.25" : undefined}
                />
            )}
            {error ? <div className="invalid-feedback d-block">{error}</div> : null}
        </>
    );
}

type ApiRecord = Record<string, unknown>;

const API_RESOURCE_BY_WORKSPACE: Record<string, string> = {
    "reported-incidents": "incidents",
    "vehicle-checks": "vehicle-checks",
    timesheets: "timesheets",
    bulletins: "bulletins",
    "hr-employees": "hr",
    "equipment-register": "equipment-register",
    "vehicle-register": "vehicle-register",
    "plant-register": "plant-register",
    documents: "documents/policies",
    "site-inspections": "site-inspections",
    "vehicle-inspections": "vehicle-inspections",
    "user-admin": "users",
};

const EMPLOYEE_RESOURCE_BY_WORKSPACE: Record<string, string> = {
    "reported-incidents": "incidents",
    "vehicle-checks": "vehicle-checks",
    timesheets: "timesheets",
};

function apiResourceForWorkspace(key: string) {
    const resource = API_RESOURCE_BY_WORKSPACE[key];
    if (resource) return resource;
    const documentPrefix = "document-library-";
    return key.startsWith(documentPrefix) ? `documents/${key.slice(documentPrefix.length)}` : undefined;
}

function firstString(record: ApiRecord, keys: string[], fallback = ""): string {
    for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null && value !== "") return String(value);
    }
    return fallback;
}

function resolveLegacyUrl(value: string) {
    if (!value) return "";
    try {
        return new URL(value, "https://ltraffic.co.uk/employeesarea/admin/").toString();
    } catch {
        return value;
    }
}

function formatTimesheetDate(value: unknown): string {
    if (value === undefined || value === null || value === "") return "";
    const text = String(value);
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (!dateMatch) return text;

    const date = new Date(Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])));
    const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
    const formattedDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
    return `${weekday} - ${formattedDate}`;
}

function normalizeApiRecord(record: ApiRecord): AdminRecord {
    const timesheetDays = Array.isArray(record.days) ? record.days.filter((day): day is ApiRecord => typeof day === "object" && day !== null && !Array.isArray(day)) : [];
    const hoursForDay = (dayIndex: number) => {
        const day = timesheetDays[dayIndex];
        return day ? String(day.hours ?? "") : "";
    };
    const dateForDay = (dayIndex: number) => formatTimesheetDate(timesheetDays[dayIndex]?.date);

    return {
        ...Object.fromEntries(Object.entries(record).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)])),
        id: firstString(record, ["id", "inspectionId", "inspection_id", "vehicleCheckId", "incidentId", "checkId", "timesheetId", "userId", "employeeId", "reference"]),
        vehicleCheckReport: firstString(record, ["id", "vehicleCheckId"]) ? "PDF Report" : "",
        vehicleCheckReportUrl: `https://ltraffic.co.uk/employeesarea/pdf/vcpdf.php?id=${encodeURIComponent(firstString(record, ["id", "vehicleCheckId"]))}`,
        status: firstString(record, ["status", "inspectionStatus", "inspection_status", "submissionStatus", "approvalStatus"]),
        operative: firstString(record, ["operativeName", "operative", "employeeName", "employeesname", "employee_name", "name", "driverName", "driversName", "drivername", "operativesname"]),
        driver: firstString(record, ["driverName", "driversName", "drivername", "operativeName", "employeeName", "name"]),
        employee: firstString(record, ["employeeName", "employeesname", "employee_name", "operativeName", "name", "username"]),
        employeeId: firstString(record, ["employeeId", "employeeid", "employeeNumber", "ltrafficid", "username", "userId", "id"]),
        date: firstString(record, ["incidentDate", "arrival_datetime", "date", "inspectionDate", "createdAt", "weekCommencing"]),
        week: firstString(record, ["weekCommencing", "week", "weekStart", "date"]),
        type: firstString(record, ["incidentType", "type", "category"]),
        location: firstString(record, ["workLocation", "work_location", "siteLocation", "site_location", "location", "site", "address"]),
        reportedBy: firstString(record, ["reportedBy", "reportedby", "reporterName", "employeeName"]),
        registration: firstString(record, ["vehiclereg", "vehicleRegistration", "registration", "reg", "plate"]),
        access: firstString(record, ["level_name", "levelName", "access", "role", "userType"]),
        vehicle: firstString(record, ["vehiclereg", "vehicleRegistration", "vehicle"]),
        mileage: firstString(record, ["mileage", "vehicleMileage"]),
        condition: firstString(record, ["condition", "equipmentCondition", "vehicleCondition", "vehiclecondition"]),
        safety: firstString(record, ["safetyCondition", "safety", "safetyStatus", "safe"]),
        title: firstString(record, ["title", "name", "documentTitle"]),
        reference: firstString(record, ["reference", "ref", "docref", "documentRef", "document_ref", "siteReference", "site_reference", "bulletinReference", "documentReference", "document_reference"]),
        description: firstString(record, ["description", "report", "notes", "documentDescription"]),
        active: firstString(record, ["active", "isActive"], "Active"),
        readCount: firstString(record, ["readCount", "read_confirm", "acknowledgedCount", "readerCount"]),
        name: firstString(record, ["name", "fullName", "employeesName", "employees_name", "title"]),
        email: firstString(record, ["email", "emailAddress", "emailaddress"]),
        phone: firstString(record, ["phone", "phoneNumber", "contactNumber", "contact_number", "mobile"]),
        jobTitle: firstString(record, ["jobTitle", "jobtitle", "role", "position"]),
        manager: firstString(record, ["manager", "lineManager", "linemanager", "line_manager"]),
        reviewDate: firstString(record, ["reviewDate", "review_date", "dateSigned", "date_signed", "arrival_datetime"]),
        employeePhoto: resolveLegacyUrl(firstString(record, ["photo_url", "employeePhoto", "photo"])),
        bulletinImage: resolveLegacyUrl(firstString(record, ["image_url", "image"])),
        documentTitle: firstString(record, ["documentTitle", "document_title", "title", "name", "docdesc", "file_name", "filename"]),
        documentUrl: resolveLegacyUrl(firstString(record, ["download_url", "file_url", "document_url", "downloadUrl", "url", "download", "file"])),
        documentLinkText: firstString(record, ["download_name", "file_name", "filename", "document", "download", "documentTitle"]),
        documentIssue: firstString(record, ["issue", "document_issue", "documentIssue", "issueNumber", "issue_date", "document_issue_date", "version", "revision", "arrival_datetime", "date"]),
        allocatedTo: firstString(record, ["allocatedTo", "assignedTo", "employeeName"]),
        assetTag: firstString(record, ["assetTag", "identificationNumber", "serialNumber"]),
        serviceDate: firstString(record, ["serviceDate", "serviceExpiry", "expiryDate"]),
        siteLead: firstString(record, ["siteLead", "site_lead", "siteGanger", "site_ganger", "siteGangerPic", "site_ganger_pic", "ganger", "pic"]),
        vehicleResult: firstString(record, ["vehicleResult", "vehicle_result", "vehicleInspectionResult", "vehicle_inspection_result", "p2_vehicle"]),
        documentation: firstString(record, ["documentation", "documentationResult", "documentation_result", "p3_documentation"]),
        workplace: firstString(record, ["workplace", "workplaceResult", "workplace_result", "p4_workplace"]),
        workingAtHeight: firstString(record, ["workingAtHeight", "working_at_height", "wahResult", "wah_result", "p5_wah"]),
        ppe: firstString(record, ["ppe", "ppeResult", "ppe_result", "p6_ppe"]),
        environment: firstString(record, ["environment", "environmentResult", "environment_result", "p7_environment"]),
        inspectionResult: firstString(record, ["inspectionResult", "inspection_result", "overallResult", "overall_result", "p8_inspection"]),
        completedBy: firstString(record, ["completedBy", "completed_by", "inspectionCompletedBy", "inspection_completed_by"]),
        safe: firstString(record, ["safe", "safeToDrive", "safe_to_drive"]),
        advisory: firstString(record, ["advisory", "advisoryWorks", "advisory_works"]),
        defects: firstString(record, ["defects", "defectWorks", "defect_works"]),
        mon: firstString(record, ["mon", "monday", "mondayHours"], hoursForDay(0)),
        monDate: dateForDay(0),
        tue: firstString(record, ["tue", "tuesday", "tuesdayHours"], hoursForDay(1)),
        tueDate: dateForDay(1),
        wed: firstString(record, ["wed", "wednesday", "wednesdayHours"], hoursForDay(2)),
        wedDate: dateForDay(2),
        thu: firstString(record, ["thu", "thursday", "thursdayHours"], hoursForDay(3)),
        thuDate: dateForDay(3),
        fri: firstString(record, ["fri", "friday", "fridayHours"], hoursForDay(4)),
        friDate: dateForDay(4),
        sat: firstString(record, ["sat", "saturday", "saturdayHours"], hoursForDay(5)),
        satDate: dateForDay(5),
        sun: firstString(record, ["sun", "sunday", "sundayHours"], hoursForDay(6)),
        sunDate: dateForDay(6),
    };
}

export default function AdminWorkspace({ config }: { config: AdminWorkspaceConfig }) {
    const role = useContext(AdminRoleContext);
    const canDelete = role !== "employees";
    const [records, setRecords] = useState<AdminRecord[]>(() => apiResourceForWorkspace(config.key) ? [] : config.initialRecords);
    const [isLoading, setIsLoading] = useState(() => Boolean(apiResourceForWorkspace(config.key)));
    const [dialog, setDialog] = useState<DialogState>(null);
    const [pdfRecord, setPdfRecord] = useState<AdminRecord | null>(null);
    const [notice, setNotice] = useState("");
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<Record<string, string>>({ mode: "onBlur" });

    useEffect(() => {
        const resource = apiResourceForWorkspace(config.key);
        if (!resource) return;
        const employeeResource = EMPLOYEE_RESOURCE_BY_WORKSPACE[config.key];
        const query = config.key === "site-inspections" ? "?source=civils" : "";
        const endpoint = role === "employees" && employeeResource
            ? `/api/employee/${employeeResource}`
            : `/api/admin/${resource}${query}`;

        const controller = new AbortController();
        void (async () => {
            try {
                const response = await fetchAdminApi(endpoint, { cache: "no-store", signal: controller.signal });
                const payload = await response.json().catch(() => null);
                if (!response.ok || payload?.success === false) {
                    setRecords([]);
                    setNotice(typeof payload?.error?.message === "string" ? payload.error.message : `API request failed (HTTP ${response.status}).`);
                    return;
                }
                const candidates = [
                    payload?.data?.records,
                    payload?.data?.items,
                    payload?.data?.results,
                    payload?.data?.list,
                    payload?.data?.incidents,
                    payload?.data?.vehicleChecks,
                    payload?.data?.timesheets,
                    payload?.data?.bulletins,
                    payload?.data?.employees,
                    payload?.data?.documents,
                    payload?.data?.inspections,
                    payload?.data?.siteInspections,
                    payload?.data?.vehicleInspections,
                    payload?.records,
                    payload?.results,
                    payload?.items,
                    payload?.data,
                ].find(Array.isArray);
                if (!Array.isArray(candidates)) {
                    setRecords([]);
                    setNotice("API response did not contain a records list.");
                    return;
                }

                let apiRecords = candidates as ApiRecord[];
                let timesheetDetailsFailed = false;
                if (config.key === "timesheets") {
                    apiRecords = await Promise.all(apiRecords.map(async (record) => {
                        if (Array.isArray(record.days)) return record;
                        const id = firstString(record, ["id", "timesheetId"]);
                        if (!id) {
                            timesheetDetailsFailed = true;
                            return record;
                        }
                        try {
                            const detailEndpoint = role === "employees"
                                ? `/api/employee/timesheets/${encodeURIComponent(id)}`
                                : `/api/admin/timesheets/${encodeURIComponent(id)}`;
                            const detailResponse = await fetchAdminApi(detailEndpoint, { cache: "no-store", signal: controller.signal });
                            if (!detailResponse.ok) {
                                timesheetDetailsFailed = true;
                                return record;
                            }
                            const detailPayload = await detailResponse.json().catch(() => null);
                            const detail = detailPayload?.data?.record ?? detailPayload?.data?.item ?? detailPayload?.data;
                            if (typeof detail === "object" && detail !== null && !Array.isArray(detail)) {
                                return { ...record, ...(detail as ApiRecord) };
                            }
                            timesheetDetailsFailed = true;
                            return record;
                        } catch {
                            timesheetDetailsFailed = true;
                            return record;
                        }
                    }));
                }
                setRecords(apiRecords.map((item) => normalizeApiRecord(item)));
                setNotice(timesheetDetailsFailed ? "Some timesheet details could not be loaded from the API." : "");
            } catch (error) {
                if (!(error instanceof DOMException && error.name === "AbortError")) {
                    setRecords([]);
                    setNotice("Unable to load records from the API.");
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        })();

        return () => controller.abort();
    }, [config.key, role]);

    const tableColumns = useMemo<ColumnDef<AdminRecord, unknown>[]>(() => {
        const configuredColumns = role === "employees" ? config.employeeColumns ?? config.columns : config.columns;
        const dataColumns: ColumnDef<AdminRecord, unknown>[] = configuredColumns.map(({ field, label, type, hrefField }) => ({
            accessorKey: field,
            header: label,
            cell: ({ getValue, row }) => {
                const value = getValue<string>();
                if (type === "image" && value) {
                    const isEmployeePhoto = field === "employeePhoto";
                    const alt = isEmployeePhoto ? `${row.original.name || "Employee"} photo` : "Bulletin image";
                    return <Image src={value} alt={alt} width={40} height={40} className={isEmployeePhoto ? "admin-employee-photo" : "admin-bulletin-image"} />;
                }
                if (type === "link") {
                    const href = hrefField ? row.original[hrefField] : value;
                    if (href) return <a href={href} target="_blank" rel="noopener noreferrer">{value || "Open document"}</a>;
                    return value || <span className="admin-workspace-empty-value">—</span>;
                }
                if (config.key === "bulletins" && field === "description" && value) {
                    return <span className="admin-bulletin-description" title={value}>{value}</span>;
                }
                return value || <span className="admin-workspace-empty-value">—</span>;
            },
        }));

        if (!(role === "employees" && config.employeeHideActions)) dataColumns.push({
            id: "actions",
            header: config.actionsLabel ?? "Actions",
            enableSorting: false,
            cell: ({ row }) => {
                const record = row.original;
                const actions: AdminTableAction[] = [
                    { label: "View", icon: <FiEye aria-hidden="true" />, onClick: () => openDialog("view", record) },
                ];
                if (role !== "employees") {
                    actions.push({ label: "Edit", icon: <FiFileText aria-hidden="true" />, onClick: () => openDialog("edit", record) });
                }
                if (role === "employees" && config.key === "timesheets" && config.pdfUrl) {
                    actions.push({ label: "PDF Report", icon: <FiDownload aria-hidden="true" />, href: config.pdfUrl.replace("{id}", encodeURIComponent(record.id)) });
                }

                if (config.pdfLabel && !config.pdfColumn) {
                    actions.push({ label: "Preview PDF", icon: <FiDownload aria-hidden="true" />, onClick: () => setPdfRecord(record) });
                }
                if (config.relatedHref) {
                    actions.push({ label: "Maintenance history", icon: <FiSettings aria-hidden="true" />, href: config.relatedHref });
                }
                if (canDelete) {
                    actions.push({ label: "Delete", icon: <FiTrash2 aria-hidden="true" />, danger: true, onClick: () => handleDelete(record) });
                }

                return <AdminTableActions label={`Actions for ${record.id}`} actions={actions} />;
            },
        });

        if (config.pdfColumn && role !== "employees") {
            dataColumns.push({
                id: "pdf-report",
                header: config.pdfColumnLabel ?? "PDF Report",
                enableSorting: false,
                cell: ({ row }) => {
                    if (config.pdfUrl) {
                        const href = config.pdfUrl.replace("{id}", encodeURIComponent(row.original.id));
                        return (
                            <a className="btn btn-sm btn-outline-secondary admin-pdf-report-link" href={href} target="_blank" rel="noopener noreferrer">
                                <FiFileText aria-hidden="true" /> PDF Report
                            </a>
                        );
                    }
                    return (
                        <button className="btn btn-sm btn-outline-secondary admin-pdf-report-link" type="button" onClick={() => setPdfRecord(row.original)}>
                            <FiDownload aria-hidden="true" /> PDF Report
                        </button>
                    );
                },
            });
        }

        return dataColumns;
    }, [canDelete, config, records, role]);

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
        reset(nextRecord);
        setDialog({ mode, record: nextRecord });
        setNotice("");
    }

    function closeDialog() {
        setDialog(null);
        reset();
    }

    async function handleRecordSubmit(values: Record<string, string>) {
        if (!dialog) return;
        const resource = apiResourceForWorkspace(config.key);
        const record = { ...values, id: dialog.mode === "edit" ? dialog.record.id : newId(records, config.key) } as AdminRecord;
        const nextRecords = dialog.mode === "edit"
            ? records.map((current) => current.id === dialog.record.id ? record : current)
            : [record, ...records];

        try {
            if (resource && dialog.mode !== "view") {
                const url = dialog.mode === "edit"
                    ? `/api/admin/${resource}/${encodeURIComponent(dialog.record.id)}`
                    : `/api/admin/${resource}`;
                const response = await fetchAdminApi(url, {
                    method: dialog.mode === "edit" ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                });
                if (!response.ok) throw new Error("API update failed");
            }
            saveRecords(nextRecords);
            closeDialog();
            setNotice(dialog.mode === "edit" ? "Record updated." : "Record added.");
        } catch {
            if (resource) {
                setNotice("The API request failed. The record was not changed.");
                return;
            }
            saveRecords(nextRecords);
            closeDialog();
            setNotice("The change was kept only in this browser.");
        }
    }

    async function handleDelete(record: AdminRecord) {
        if (!window.confirm(`Delete ${record.id}?`)) return;
        const resource = apiResourceForWorkspace(config.key);
        try {
            if (resource) {
                const response = await fetchAdminApi(`/api/admin/${resource}/${encodeURIComponent(record.id)}`, { method: "DELETE" });
                if (!response.ok) throw new Error("API delete failed");
            }
            saveRecords(records.filter((current) => current.id !== record.id));
            setNotice("Record deleted.");
        } catch {
            if (resource) {
                setNotice("The API delete failed. The record was not removed.");
                return;
            }
            saveRecords(records.filter((current) => current.id !== record.id));
            setNotice("The record was removed only from this browser.");
        }
    }

    const createHref = role === "employees"
        ? config.key === "reported-incidents" ? "/admin/employees/report-an-incident/new" : undefined
        : config.createHref;

    return (
        <section className="admin-workspace-page">
            <AdminPageHeading
                title={config.title}
                actions={createHref ? (
                    <Link className="btn btn-primary admin-workspace-add" href={createHref}>
                        <FiPlus aria-hidden="true" /> New incident
                    </Link>
                ) : role === "employees" ? undefined : (
                    <button className="btn btn-primary admin-workspace-add" type="button" onClick={() => openDialog("create")}>
                        <FiPlus aria-hidden="true" /> Add record
                    </button>
                )}
            />

            {notice && <p className="admin-workspace-notice" role="status">{notice}</p>}

            <div className="admin-workspace-table-wrap">
                <AdminDataTable
                    columns={tableColumns}
                    data={records}
                    statusField={config.statusField}
                    statusLabel={config.statusField ? `All ${config.statusField === "status" ? "statuses" : config.statusField}` : undefined}
                    searchPlaceholder="Search records"
                    emptyMessage={isLoading ? "Loading records..." : records.length === 0 ? "No data found." : "No records match this search or filter."}
                />
            </div>

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
                            <form className="admin-record-form" onSubmit={handleSubmit(handleRecordSubmit)}>
                                <section className="admin-record-form-section">
                                    <div className="admin-form-section-heading">
                                        <h3>Record details</h3>
                                    </div>
                                    <div className="row g-3">
                                        {config.fields.filter((field) => field.type !== "textarea").map((field) => (
                                            <div className="col-12 col-md-6" key={field.name}>
                                                <label className="form-label" htmlFor={`admin-field-${field.name}`}>
                                                    {field.label}{field.required && <span className="admin-field-required" aria-label="Required"> *</span>}
                                                </label>
                                                <FieldInput field={field} register={register} errors={errors} />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                                {config.fields.some((field) => field.type === "textarea") && (
                                    <section className="admin-record-form-section">
                                        <div className="admin-form-section-heading">
                                            <h3>Additional information</h3>
                                        </div>
                                        <div className="row g-3">
                                            {config.fields.filter((field) => field.type === "textarea").map((field) => (
                                                <div className="col-12" key={field.name}>
                                                    <label className="form-label" htmlFor={`admin-field-${field.name}`}>
                                                        {field.label}{field.required && <span className="admin-field-required" aria-label="Required"> *</span>}
                                                    </label>
                                                    <FieldInput field={field} register={register} errors={errors} />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
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
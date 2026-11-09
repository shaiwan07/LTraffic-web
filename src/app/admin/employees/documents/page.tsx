import EmployeeApiWorkspace, { type EmployeeApiColumn } from "../employee-api-workspace";

function documentColumns(linkLabel: string): EmployeeApiColumn[] {
    return [
        { label: "Document Reference", field: "reference", aliases: ["ref", "docref", "documentReference", "document_reference"] },
        {
            label: linkLabel,
            field: "documentTitle",
            aliases: ["title", "name", "docdesc", "file_name", "filename"],
            type: "link",
            hrefField: "documentUrl",
            hrefAliases: ["download_url", "file_url", "document_url", "downloadUrl", "url", "download", "file"],
        },
        { label: "Document Issue", field: "documentIssue", aliases: ["issue", "issue_date", "version", "revision", "arrival_datetime", "date"] },
    ];
}

export default function EmployeeDocumentsPage() {
    return (
        <EmployeeApiWorkspace
            title="LTraffic Documents"
            description="Browse published employee documents."
            sections={[
                { title: "Policies", endpoint: "/api/employee/documents/policies", columns: documentColumns("Policy Link") },
                { title: "Method Statements", endpoint: "/api/employee/documents/method-statements", columns: documentColumns("Method Statement Link") },
                { title: "Processes", endpoint: "/api/employee/documents/processes", columns: documentColumns("Process Link") },
                { title: "CoSHH", endpoint: "/api/employee/documents/coshh", columns: documentColumns("CoSHH Link") },
            ]}
        />
    );
}
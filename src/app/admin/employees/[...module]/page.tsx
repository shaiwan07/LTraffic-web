import { notFound } from "next/navigation";
import EmployeeApiWorkspace, { type EmployeeApiColumn, type EmployeeApiSectionConfig } from "../employee-api-workspace";

const wildanetColumns: EmployeeApiColumn[] = [
    { label: "ID", field: "id" },
    { label: "Job Status", field: "jobstatus", aliases: ["jobStatus", "status"] },
    { label: "Assigned To", field: "assignedto", aliases: ["assignedTo"] },
    { label: "Client", field: "client" },
    { label: "Job Number", field: "solonumber", aliases: ["jobNumber", "jobnumber"] },
    { label: "Location", field: "location" },
    { label: "Permit Status", field: "permitstatus", aliases: ["permitStatus"] },
    { label: "Start Date", field: "startdate", aliases: ["startDate"] },
    { label: "End Date", field: "enddate", aliases: ["endDate"] },
    { label: "Links", field: "links", aliases: ["viewUrl", "view_url"], type: "link", hrefField: "links", hrefAliases: ["viewUrl", "view_url"] },
];

const piaWahColumns: EmployeeApiColumn[] = [
    { label: "ID", field: "id" },
    { label: "Operative Name", field: "wah1", aliases: ["operativeName", "operative_name", "name"] },
    { label: "Job Location", field: "wah2", aliases: ["location"] },
    { label: "Date / Time Recorded", field: "wah3", aliases: ["arrival_datetime", "dateTime", "date_time"] },
    { label: "Cabinet Area", field: "wah4", aliases: ["cabinetArea", "cabinet_area"] },
    { label: "PN", field: "pn", aliases: ["primaryNode", "primary_node"] },
    { label: "SN Type", field: "snt", aliases: ["snType", "sn_type"] },
    { label: "SN", field: "sn", aliases: ["secondaryNode", "secondary_node"] },
    { label: "Ladders in Good Condition?", field: "wah7" },
    { label: "Harness / Lanyard in Good Condition?", field: "wah8" },
    { label: "PPE in Good Condition?", field: "wah9" },
    { label: "Is the Pole safe to climb?", field: "wah10" },
    { label: "Is the work area safe?", field: "wah11" },
    { label: "Are the Ladders secured?", field: "wah12" },
    { label: "Lone Working?", field: "wah13" },
    { label: "Work Type", field: "work_type", aliases: ["workType", "type"] },
    { label: "Links", field: "links", aliases: ["viewUrl", "view_url"] },
    { label: "PDF Report", field: "id", type: "pdf", hrefTemplate: "https://ltraffic.co.uk/employeesarea/pdf/wahpdf.php?id={id}" },
];

const employeeModules: Record<string, { title: string; description: string; sections: EmployeeApiSectionConfig[] }> = {
    "team-up-calendar": {
        title: "Team up Calender",
        description: "Review your assigned work records.",
        sections: [{ title: "Work Records", endpoint: "/api/employee/work-records" }],
    },
    "wildanet-project": {
        title: "Wildanet Project",
        description: "View active Wildanet jobs and your risk assessments.",
        sections: [
            { title: "Active Jobs", endpoint: "/api/employee/wildanet-jobs", columns: wildanetColumns },
            { title: "Risk Assessments", endpoint: "/api/employee/wildanet-risk-assessments" },
        ],
    },
    "pia-fibre-risk-assessment": {
        title: "PIA & Fibre Risk Assessment",
        description: "View your Working at Height, Underground Works and MEWP assessments.",
        sections: [
            { title: "Working at Height", endpoint: "/api/employee/pia-fibre-risk/wah", columns: piaWahColumns },
            { title: "Underground Works", endpoint: "/api/employee/pia-fibre-risk/ug" },
            { title: "MEWP Works", endpoint: "/api/employee/pia-fibre-risk/mewp" },
        ],
    },
};

export default async function EmployeeModulePage({ params }: { params: Promise<{ module: string[] }> }) {
    const { module } = await params;
    const employeeModule = module.length === 1 ? employeeModules[module[0]] : undefined;
    if (!employeeModule) notFound();

    return <EmployeeApiWorkspace {...employeeModule} />;
}
export type AdminField = {
    name: string;
    label: string;
    type?: "text" | "date" | "number" | "email" | "tel" | "textarea" | "select";
    required?: boolean;
    options?: string[];
};

export type AdminColumn = {
    label: string;
    field: string;
};

export type AdminRecord = Record<string, string> & { id: string };

export type AdminWorkspaceConfig = {
    key: string;
    title: string;
    description: string;
    columns: AdminColumn[];
    fields: AdminField[];
    initialRecords: AdminRecord[];
    statusField?: string;
    pdfLabel?: string;
    createHref?: string;
    relatedHref?: string;
};

export const incidentRecords: AdminWorkspaceConfig = {
    key: "reported-incidents",
    title: "Reported Incidents",
    description: "Review, investigate and close incident reports.",
    statusField: "status",
    pdfLabel: "Incident report",
    createHref: "/admin/report-an-incident/new",
    columns: [
        { label: "ID", field: "id" },
        { label: "Status", field: "status" },
        { label: "Operative", field: "operative" },
        { label: "Date / time", field: "date" },
        { label: "Incident type", field: "type" },
        { label: "Location", field: "location" },
        { label: "Reported by", field: "reportedBy" },
    ],
    fields: [
        { name: "status", label: "Status", type: "select", options: ["Open", "Under investigation", "Closed"], required: true },
        { name: "operative", label: "Operatives name", required: true },
        { name: "date", label: "Date and time", type: "date", required: true },
        { name: "type", label: "Type of incident", type: "select", options: ["Accident", "Customer complaint", "Customer engagement", "Environmental incident", "Near miss", "Service strike"], required: true },
        { name: "location", label: "Location", required: true },
        { name: "reportedBy", label: "Reported by", required: true },
        { name: "description", label: "What happened?", type: "textarea", required: true },
        { name: "parties", label: "Details of parties involved", type: "textarea" },
        { name: "injuries", label: "Was anyone injured?", type: "select", options: ["Yes", "No"] },
        { name: "injuredParty", label: "Name of injured party" },
        { name: "injuryDetails", label: "Injury details", type: "textarea" },
        { name: "reportedToManager", label: "Reported to manager?", type: "select", options: ["Yes", "No"] },
        { name: "companyAdvised", label: "Company advised?", type: "select", options: ["Yes", "No"] },
        { name: "companyNotifiedLater", label: "Company notified later?", type: "select", options: ["Yes", "No"] },
        { name: "companyDetails", label: "Company report details", type: "textarea" },
        { name: "witnesses", label: "Were there witnesses?", type: "select", options: ["Yes", "No"] },
        { name: "witnessName", label: "Witness name" },
        { name: "witnessAddress", label: "Witness address" },
        { name: "witnessContact", label: "Witness contact number", type: "tel" },
        { name: "otherWitnesses", label: "Other witness details", type: "textarea" },
        { name: "investigation", label: "Investigation report", type: "textarea" },
    ],
    initialRecords: [
        { id: "IR-1074", status: "Open", operative: "Alex Morgan", date: "2026-10-14", type: "Near miss", location: "Northgate site", reportedBy: "Site supervisor", description: "A temporary barrier was found displaced during the morning check.", parties: "No third party involved.", injuries: "No", reportedToManager: "Yes", companyAdvised: "No", companyNotifiedLater: "No", witnesses: "No", investigation: "Area secured and the barrier reset." },
        { id: "IR-1073", status: "Under investigation", operative: "Jamie Taylor", date: "2026-10-10", type: "Service strike", location: "Riverside works", reportedBy: "Project lead", description: "A service was exposed during excavation. Work stopped and the area was isolated.", parties: "Utility provider notified.", injuries: "No", reportedToManager: "Yes", companyAdvised: "Yes", companyNotifiedLater: "No", companyDetails: "Utility provider reference recorded by the project lead.", witnesses: "Yes", witnessName: "Site lead", investigation: "Awaiting utility provider report." },
        { id: "IR-1072", status: "Closed", operative: "Sam Patel", date: "2026-10-02", type: "Accident", location: "Depot yard", reportedBy: "Operations manager", description: "A minor hand injury was reported while unloading equipment.", injuries: "Yes", injuredParty: "Operative A", injuryDetails: "Minor hand injury; first aid provided.", reportedToManager: "Yes", companyAdvised: "No", companyNotifiedLater: "No", witnesses: "Yes", witnessName: "Yard supervisor", investigation: "Unloading procedure reviewed." },
    ],
};

export const vehicleChecks: AdminWorkspaceConfig = {
    key: "vehicle-checks",
    title: "Vehicle Checks",
    description: "Review driver checks, vehicle condition and safety actions.",
    statusField: "safety",
    pdfLabel: "Vehicle check report",
    columns: [
        { label: "ID", field: "id" },
        { label: "Driver", field: "driver" },
        { label: "Registration", field: "registration" },
        { label: "Mileage", field: "mileage" },
        { label: "Inspection date", field: "date" },
        { label: "Vehicle condition", field: "condition" },
        { label: "Safety condition", field: "safety" },
    ],
    fields: [
        { name: "driver", label: "Driver name", required: true },
        { name: "registration", label: "Vehicle registration", required: true },
        { name: "mileage", label: "Vehicle mileage", type: "number", required: true },
        { name: "date", label: "Inspection date", type: "date", required: true },
        { name: "condition", label: "Vehicle condition", type: "select", options: ["New", "Good", "Average", "Requires attention"], required: true },
        { name: "safety", label: "Safety condition", type: "select", options: ["Safe", "Action required", "Unsafe"], required: true },
        { name: "notes", label: "Notes", type: "textarea" },
    ],
    initialRecords: [
        { id: "VC-11113", driver: "Alex Morgan", registration: "LT26 DEM", mileage: "63060", date: "2026-10-12", condition: "Good", safety: "Safe", notes: "No defects reported." },
        { id: "VC-11112", driver: "Jamie Taylor", registration: "LT24 DEM", mileage: "62461", date: "2026-10-08", condition: "Average", safety: "Action required", notes: "Replace a worn wiper before next long journey." },
    ],
};

export const timesheets: AdminWorkspaceConfig = {
    key: "timesheets",
    title: "Timesheets",
    description: "Check submitted weekly hours and review employee timesheets.",
    statusField: "status",
    pdfLabel: "Timesheet",
    columns: [
        { label: "ID", field: "id" },
        { label: "Operative", field: "employee" },
        { label: "Employee ID", field: "employeeId" },
        { label: "Week commencing", field: "week" },
        { label: "Mon", field: "mon" },
        { label: "Tue", field: "tue" },
        { label: "Wed", field: "wed" },
        { label: "Thu", field: "thu" },
        { label: "Fri", field: "fri" },
        { label: "Sat", field: "sat" },
        { label: "Sun", field: "sun" },
        { label: "Status", field: "status" },
    ],
    fields: [
        { name: "employee", label: "Operatives name", required: true },
        { name: "employeeId", label: "Employee ID", required: true },
        { name: "week", label: "Week commencing", type: "date", required: true },
        { name: "mon", label: "Monday hours", type: "number", required: true },
        { name: "tue", label: "Tuesday hours", type: "number", required: true },
        { name: "wed", label: "Wednesday hours", type: "number", required: true },
        { name: "thu", label: "Thursday hours", type: "number", required: true },
        { name: "fri", label: "Friday hours", type: "number", required: true },
        { name: "sat", label: "Saturday hours", type: "number", required: true },
        { name: "sun", label: "Sunday hours", type: "number", required: true },
        { name: "status", label: "Status", type: "select", options: ["Submitted", "Approved", "Returned"], required: true },
    ],
    initialRecords: [
        { id: "TS-240", employee: "Demo Operative A", employeeId: "DEMO-07", week: "2026-10-05", mon: "0", tue: "10", wed: "10", thu: "0", fri: "10", sat: "0", sun: "0", status: "Submitted" },
        { id: "TS-239", employee: "Demo Operative B", employeeId: "DEMO-12", week: "2026-09-28", mon: "0", tue: "10", wed: "10", thu: "0", fri: "0", sat: "0", sun: "0", status: "Approved" },
    ],
};

export const bulletins: AdminWorkspaceConfig = {
    key: "bulletins",
    title: "Bulletin Manager",
    description: "Publish employee notices and track whether staff have confirmed reading them.",
    statusField: "active",
    pdfLabel: "Bulletin",
    columns: [
        { label: "Reference", field: "reference" },
        { label: "Title", field: "title" },
        { label: "Description", field: "description" },
        { label: "Date added", field: "date" },
        { label: "Document", field: "document" },
        { label: "Active", field: "active" },
        { label: "Read confirmations", field: "readCount" },
    ],
    fields: [
        { name: "title", label: "Bulletin title", required: true },
        { name: "reference", label: "Bulletin reference", required: true },
        { name: "description", label: "Bulletin description", type: "textarea", required: true },
        { name: "document", label: "Document link" },
        { name: "date", label: "Date added", type: "date", required: true },
        { name: "active", label: "Active status", type: "select", options: ["Active", "Inactive"], required: true },
        { name: "readCount", label: "Read confirmations", type: "number" },
    ],
    initialRecords: [
        { id: "21", reference: "LT-BULLETIN-18", title: "Document update", description: "Updated policies and procedures are available in the document library.", document: "Policies library", date: "2026-05-20", active: "Active", readCount: "28" },
        { id: "20", reference: "LT-BULLETIN-17", title: "Safety briefing", description: "Read the latest safety briefing before your next site assignment.", document: "Safety briefing.pdf", date: "2025-04-23", active: "Inactive", readCount: "42" },
    ],
};

export const employees: AdminWorkspaceConfig = {
    key: "hr-employees",
    title: "HR Manager",
    description: "Manage employee profiles, work details and onboarding records.",
    pdfLabel: "Employee onboarding record",
    columns: [
        { label: "Employee ID", field: "employeeId" },
        { label: "Employee", field: "name" },
        { label: "Contact", field: "phone" },
        { label: "Email", field: "email" },
        { label: "Job title", field: "jobTitle" },
        { label: "Line manager", field: "manager" },
        { label: "Work location", field: "location" },
        { label: "Review date", field: "reviewDate" },
    ],
    fields: [
        { name: "employeeId", label: "Employee ID", required: true },
        { name: "name", label: "Employee name", required: true },
        { name: "email", label: "Email address", type: "email" },
        { name: "phone", label: "Contact number", type: "tel" },
        { name: "jobTitle", label: "Job title", required: true },
        { name: "manager", label: "Line manager" },
        { name: "location", label: "Work location" },
        { name: "reviewDate", label: "Review / date signed", type: "date" },
    ],
    initialRecords: [
        { id: "10", employeeId: "DEMO-001", name: "Alex Morgan", email: "alex@example.test", phone: "", jobTitle: "Operations lead", manager: "—", location: "Regional office", reviewDate: "2026-06-01" },
        { id: "22", employeeId: "DEMO-002", name: "Jamie Taylor", email: "jamie@example.test", phone: "", jobTitle: "Site operative", manager: "Alex Morgan", location: "South team", reviewDate: "2026-08-12" },
    ],
};

export const equipment: AdminWorkspaceConfig = {
    key: "equipment-register",
    title: "Equipment Register",
    description: "Track equipment ownership, allocation, condition and service dates.",
    columns: [
        { label: "Item", field: "name" },
        { label: "Description", field: "description" },
        { label: "Identification no.", field: "assetTag" },
        { label: "Allocated to", field: "allocatedTo" },
        { label: "Allocation date", field: "allocationDate" },
        { label: "Condition", field: "condition" },
        { label: "Service expiry", field: "serviceDate" },
    ],
    fields: [
        { name: "name", label: "Item name", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "assetTag", label: "Identification number", required: true },
        { name: "allocatedTo", label: "Allocated to" },
        { name: "allocationDate", label: "Allocation date", type: "date" },
        { name: "condition", label: "Condition", type: "select", options: ["New", "Good", "Average", "Requires attention"], required: true },
        { name: "serviceDate", label: "Service / calibration expiry", type: "date" },
    ],
    initialRecords: [
        { id: "EQ-00003", name: "Cable locator", description: "Service locator", assetTag: "DEMO-EQ-03", allocatedTo: "Field team A", allocationDate: "2026-01-04", condition: "Good", serviceDate: "2027-02-28" },
        { id: "EQ-00004", name: "Site scanner", description: "Survey scanner", assetTag: "DEMO-EQ-04", allocatedTo: "Unallocated", allocationDate: "2026-09-10", condition: "New", serviceDate: "" },
    ],
};

export const vehicles: AdminWorkspaceConfig = {
    ...equipment,
    key: "vehicle-register",
    title: "Vehicle Register",
    description: "Manage vehicle details, allocation and inspection dates.",
    relatedHref: "/admin/equipment-allocation/vehicle-register/maintenance",
    columns: [
        { label: "Registration", field: "registration" },
        { label: "Make / model", field: "name" },
        { label: "Allocated to", field: "allocatedTo" },
        { label: "Allocation date", field: "allocationDate" },
        { label: "Active", field: "active" },
        { label: "MOT expiry", field: "motExpiry" },
        { label: "Tax expiry", field: "taxExpiry" },
        { label: "Service expiry", field: "serviceDate" },
        { label: "Condition", field: "condition" },
        { label: "Notes", field: "description" },
    ],
    fields: [
        { name: "registration", label: "Vehicle registration", required: true },
        { name: "name", label: "Make / model", required: true },
        { name: "allocatedTo", label: "Allocated to" },
        { name: "allocationDate", label: "Allocation date", type: "date" },
        { name: "active", label: "Active status", type: "select", options: ["Yes", "No"], required: true },
        { name: "motExpiry", label: "MOT expiry", type: "date" },
        { name: "taxExpiry", label: "Vehicle tax expiry", type: "date" },
        { name: "serviceDate", label: "MOT / service expiry", type: "date" },
        { name: "condition", label: "Condition", type: "select", options: ["Good", "Average", "Requires attention"], required: true },
        { name: "description", label: "Notes", type: "textarea" },
    ],
    initialRecords: [
        { id: "VR-001", registration: "LT26 DEM", name: "Utility van", allocatedTo: "Field team A", allocationDate: "2026-01-15", active: "Yes", motExpiry: "2027-03-01", taxExpiry: "2027-03-31", serviceDate: "2027-01-15", condition: "Good", description: "Pool vehicle." },
        { id: "VR-002", registration: "LT24 DEM", name: "Crew van", allocatedTo: "Field team B", allocationDate: "2026-03-04", active: "Yes", motExpiry: "2026-12-01", taxExpiry: "2027-03-31", serviceDate: "2026-11-20", condition: "Average", description: "Service booking required." },
    ],
};

export const plant: AdminWorkspaceConfig = {
    ...equipment,
    key: "plant-register",
    title: "Plant Register",
    description: "Manage plant assets, responsible teams and service requirements.",
    initialRecords: [
        { id: "PL-001", name: "Tracked dumper", description: "Site plant", assetTag: "DEMO-PL-01", allocatedTo: "Groundworks team", allocationDate: "2026-03-10", condition: "Good", serviceDate: "2026-11-30" },
        { id: "PL-002", name: "Mini excavator", description: "Compact excavator", assetTag: "DEMO-PL-02", allocatedTo: "Unallocated", allocationDate: "2026-02-01", condition: "Average", serviceDate: "2026-12-18" },
    ],
};

export const siteInspections: AdminWorkspaceConfig = {
    key: "site-inspections",
    title: "Site Inspections",
    description: "Review live and completed site inspection results.",
    statusField: "status",
    pdfLabel: "Site inspection report",
    columns: [
        { label: "ID", field: "id" },
        { label: "Status", field: "status" },
        { label: "Site reference", field: "reference" },
        { label: "Location", field: "location" },
        { label: "Site lead", field: "siteLead" },
        { label: "Vehicle", field: "vehicleResult" },
        { label: "Documentation", field: "documentation" },
        { label: "Workplace / facilities", field: "workplace" },
        { label: "Working at height", field: "workingAtHeight" },
        { label: "PPE", field: "ppe" },
        { label: "Environment", field: "environment" },
        { label: "Overall result", field: "inspectionResult" },
        { label: "Completed by", field: "completedBy" },
    ],
    fields: [
        { name: "status", label: "Inspection status", type: "select", options: ["Live", "Completed", "Action required"], required: true },
        { name: "reference", label: "Site reference", required: true },
        { name: "location", label: "Site location", required: true },
        { name: "siteLead", label: "Site ganger / PIC", required: true },
        { name: "vehicleResult", label: "Vehicle inspection result", type: "select", options: ["Pass", "Action required", "Not applicable"] },
        { name: "documentation", label: "Documentation result", type: "select", options: ["Pass", "Action required", "Not applicable"] },
        { name: "workplace", label: "Workplace & site facilities result", type: "select", options: ["Pass", "Action required", "Not applicable"] },
        { name: "workingAtHeight", label: "Working at height result", type: "select", options: ["Pass", "Action required", "Not applicable"] },
        { name: "ppe", label: "PPE result", type: "select", options: ["Pass", "Action required", "Not applicable"] },
        { name: "environment", label: "Environmental protection result", type: "select", options: ["Pass", "Action required", "Not applicable"] },
        { name: "inspectionResult", label: "Overall inspection result", type: "select", options: ["Satisfactory", "Action required", "Unsatisfactory"] },
        { name: "completedBy", label: "Inspection completed by" },
        { name: "notes", label: "Inspection notes", type: "textarea" },
    ],
    initialRecords: [
        { id: "SI-024", status: "Live", reference: "SITE-DEMO-24", location: "Northgate works", siteLead: "Site lead A", vehicleResult: "Pass", documentation: "Pass", workplace: "Pass", workingAtHeight: "Not applicable", ppe: "Pass", environment: "Pass", inspectionResult: "Satisfactory", completedBy: "—", notes: "Inspection in progress." },
        { id: "SI-023", status: "Completed", reference: "SITE-DEMO-23", location: "Riverside works", siteLead: "Site lead B", vehicleResult: "Pass", documentation: "Pass", workplace: "Pass", workingAtHeight: "Pass", ppe: "Action required", environment: "Pass", inspectionResult: "Action required", completedBy: "Inspector A", notes: "PPE signage refreshed." },
    ],
};

export const vehicleInspections: AdminWorkspaceConfig = {
    key: "vehicle-inspections",
    title: "Vehicle Inspections",
    description: "Review inspection mileage, roadworthiness and required works.",
    statusField: "status",
    pdfLabel: "Vehicle inspection report",
    columns: [
        { label: "ID", field: "id" },
        { label: "Completed by", field: "completedBy" },
        { label: "Date", field: "date" },
        { label: "Registration", field: "registration" },
        { label: "Mileage", field: "mileage" },
        { label: "Safe to drive", field: "safe" },
        { label: "Advisory works", field: "advisory" },
        { label: "Defect works", field: "defects" },
        { label: "Status", field: "status" },
    ],
    fields: [
        { name: "completedBy", label: "Inspection completed by", required: true },
        { name: "date", label: "Inspection date", type: "date", required: true },
        { name: "registration", label: "Vehicle registration", required: true },
        { name: "mileage", label: "Vehicle mileage", type: "number", required: true },
        { name: "safe", label: "Vehicle safe to drive", type: "select", options: ["Yes", "No"], required: true },
        { name: "advisory", label: "Advisory works required", type: "select", options: ["Yes", "No"], required: true },
        { name: "defects", label: "Defect works required", type: "select", options: ["Yes", "No"], required: true },
        { name: "status", label: "Status", type: "select", options: ["Completed", "Review required"], required: true },
        { name: "notes", label: "Defect / advisory details", type: "textarea" },
    ],
    initialRecords: [
        { id: "VI-034", completedBy: "Inspector A", date: "2026-10-13", registration: "LT26 DEM", mileage: "154078", safe: "Yes", advisory: "No", defects: "Yes", status: "Completed", notes: "Replace rear lamp assembly." },
        { id: "VI-033", completedBy: "Inspector B", date: "2026-10-10", registration: "LT24 DEM", mileage: "144432", safe: "Yes", advisory: "Yes", defects: "No", status: "Review required", notes: "Monitor tyre wear." },
    ],
};

export const userAccounts: AdminWorkspaceConfig = {
    key: "user-admin",
    title: "User Admin",
    description: "Manage employee portal accounts, access levels and onboarding status.",
    statusField: "onboarding",
    columns: [
        { label: "ID", field: "id" },
        { label: "Employee ID", field: "employeeId" },
        { label: "Employee", field: "name" },
        { label: "Username", field: "username" },
        { label: "Access level", field: "access" },
        { label: "Email", field: "email" },
        { label: "Vehicle registration", field: "vehicle" },
        { label: "Onboarding", field: "onboarding" },
    ],
    fields: [
        { name: "employeeId", label: "Employee ID", required: true },
        { name: "name", label: "Employee name", required: true },
        { name: "username", label: "Username", required: true },
        { name: "access", label: "Access level", type: "select", options: ["Employee", "Supervisor", "Manager", "Administrator"], required: true },
        { name: "email", label: "Email address", type: "email" },
        { name: "vehicle", label: "Vehicle registration" },
        { name: "onboarding", label: "Onboarding status", type: "select", options: ["Complete", "In progress", "Not started"], required: true },
    ],
    initialRecords: [
        { id: "UA-001", employeeId: "DEMO-001", name: "Alex Morgan", username: "alex.demo", access: "Administrator", email: "alex@example.test", vehicle: "LT26 DEM", onboarding: "Complete" },
        { id: "UA-002", employeeId: "DEMO-002", name: "Jamie Taylor", username: "jamie.demo", access: "Employee", email: "jamie@example.test", vehicle: "—", onboarding: "In progress" },
    ],
};

export const documents: AdminWorkspaceConfig = {
    key: "document-library",
    title: "Document Library",
    description: "Manage controlled documents, revisions and publication status.",
    statusField: "status",
    pdfLabel: "Document",
    columns: [
        { label: "Reference", field: "reference" },
        { label: "Document", field: "title" },
        { label: "Category", field: "category" },
        { label: "Version", field: "version" },
        { label: "Review date", field: "reviewDate" },
        { label: "Status", field: "status" },
    ],
    fields: [
        { name: "reference", label: "Document reference", required: true },
        { name: "title", label: "Document title", required: true },
        { name: "category", label: "Category", type: "select", options: ["Policies", "Method statements", "Processes", "CoSHH"], required: true },
        { name: "version", label: "Version", required: true },
        { name: "reviewDate", label: "Review date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["Published", "Review due", "Archived"], required: true },
        { name: "description", label: "Description", type: "textarea" },
    ],
    initialRecords: [
        { id: "DOC-018", reference: "LT-POL-018", title: "Site safety policy", category: "Policies", version: "3.0", reviewDate: "2027-03-01", status: "Published", description: "Current site safety policy." },
        { id: "DOC-024", reference: "LT-MS-024", title: "Utility excavation method", category: "Method statements", version: "2.1", reviewDate: "2026-12-15", status: "Review due", description: "Controlled method statement." },
        { id: "DOC-031", reference: "LT-PR-031", title: "Incident notification process", category: "Processes", version: "1.4", reviewDate: "2027-01-20", status: "Published", description: "Internal reporting and escalation steps." },
        { id: "DOC-042", reference: "LT-CS-042", title: "Cement and grout assessment", category: "CoSHH", version: "2.0", reviewDate: "2027-02-15", status: "Published", description: "Hazard controls for cement-based products." },
    ],
};

export function getDocumentCategoryConfig(category: string): AdminWorkspaceConfig {
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
        ...documents,
        key: `document-library-${slug}`,
        title: `${category} Documents`,
        description: `Search and maintain controlled ${category.toLowerCase()} documents and their issue status.`,
        initialRecords: documents.initialRecords.filter((record) => record.category === category),
        fields: documents.fields.map((field) => field.name === "category" ? { ...field, options: [category] } : field),
    };
}

export const adminWorkspaceConfigs = {
    incidentRecords,
    vehicleChecks,
    timesheets,
    bulletins,
    employees,
    equipment,
    vehicles,
    plant,
    siteInspections,
    vehicleInspections,
    userAccounts,
    documents,
};

export const vehicleMaintenance: AdminWorkspaceConfig = {
    key: "vehicle-maintenance",
    title: "Vehicle Maintenance",
    description: "Track vehicle servicing, maintenance checks, findings and follow-up actions.",
    pdfLabel: "Vehicle maintenance record",
    columns: [
        { label: "ID", field: "id" },
        { label: "Registration", field: "registration" },
        { label: "Maintenance date", field: "date" },
        { label: "Work completed", field: "work" },
        { label: "Completed by", field: "completedBy" },
        { label: "Next due", field: "nextDue" },
    ],
    fields: [
        { name: "registration", label: "Vehicle registration", required: true },
        { name: "date", label: "Maintenance date", type: "date", required: true },
        { name: "work", label: "Work completed", type: "textarea", required: true },
        { name: "completedBy", label: "Completed by", required: true },
        { name: "nextDue", label: "Next due date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
    ],
    initialRecords: [
        { id: "VM-014", registration: "LT26 DEM", date: "2026-10-01", work: "Routine service and safety check.", completedBy: "Workshop team A", nextDue: "2027-04-01", notes: "No outstanding issues." },
        { id: "VM-013", registration: "LT24 DEM", date: "2026-09-14", work: "Tyre inspection and wiper replacement.", completedBy: "Workshop team B", nextDue: "2027-03-14", notes: "Recheck tyre wear at next visit." },
    ],
};
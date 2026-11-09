import type { Metadata } from "next";
import EmployeeApiWorkspace, { type EmployeeApiSectionConfig } from "../employees/employee-api-workspace";

export const metadata: Metadata = {
    title: "Employees Area | LTraffic Admin",
    description: "Manage the LTraffic employee area.",
};

export default function EmployeesAreaPage() {
    const contactColumns: EmployeeApiSectionConfig["columns"] = [
        { label: "Employee ID", field: "employeeid", aliases: ["employeeId"] },
        { label: "Employees Name", field: "name", aliases: ["employeesname", "fullName"] },
        { label: "Contact Number", field: "phone", aliases: ["contact_number", "contactNumber"] },
        { label: "Email Address", field: "email", aliases: ["emailaddress"] },
        { label: "Job Title", field: "jobtitle", aliases: ["jobTitle"] },
        { label: "Line Manager", field: "linemanager", aliases: ["lineManager", "manager"] },
        { label: "Work Location", field: "location", aliases: ["workLocation"] },
        { label: "Employee Photo", field: "photo_url", aliases: ["photoUrl"], type: "image" },
    ];

    return (
        <EmployeeApiWorkspace
            title="Contact Directory"
            description="Find employee contact details."
            sections={[{ title: "Employees", endpoint: "/api/employee/contacts", columns: contactColumns }]}
        />
    );
}

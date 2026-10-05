import type { Metadata } from "next";
import { FiUsers } from "react-icons/fi";

export const metadata: Metadata = {
    title: "Employees Area | LTraffic Admin",
    description: "Manage the LTraffic employee area.",
};

export default function EmployeesAreaPage() {
    return (
        <section className="employees-page">
            <div className="admin-page-heading">
                <div>
                    <span className="admin-eyebrow">Workspace</span>
                    <h1>Employees Area</h1>
                    <p>View and manage your employee directory.</p>
                </div>
                <span className="employees-count"><FiUsers aria-hidden="true" /> 0 employees</span>
            </div>

            <div className="employees-panel">
                <div className="employees-panel-heading">
                    <div>
                        <h2>Employee directory</h2>
                        <p>Your team will be listed here.</p>
                    </div>
                </div>
                <div className="employees-empty-state">
                    <span className="employees-empty-icon"><FiUsers aria-hidden="true" /></span>
                    <h3>No employees yet</h3>
                    <p>Employee records will appear here when they are added.</p>
                </div>
            </div>
        </section>
    );
}

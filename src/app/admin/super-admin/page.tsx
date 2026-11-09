import Link from "next/link";
import { FiArrowUpRight, FiGrid } from "react-icons/fi";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import { superAdminModules } from "./admin-menu";

export default function SuperAdminPage() {
    return (
        <section className="admin-overview">
            <AdminPageHeading
                title="Super Admin"
                actions={<span className="admin-overview-badge"><FiGrid aria-hidden="true" /> {superAdminModules.length} workspaces</span>}
            />
            <div className="admin-module-grid">
                {superAdminModules.map(({ label, href, description, icon: Icon }, index) => (
                    <Link className="admin-module-card" href={href} key={href}>
                        <span className="admin-module-index">{String(index + 1).padStart(2, "0")}</span>
                        <span className="admin-module-icon"><Icon aria-hidden="true" /></span>
                        <h2>{label}</h2>
                        <p>{description}</p>
                        <FiArrowUpRight className="admin-module-arrow" aria-hidden="true" />
                    </Link>
                ))}
            </div>
        </section>
    );
}

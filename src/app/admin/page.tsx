import Link from "next/link";
import { FiArrowUpRight, FiGrid } from "react-icons/fi";
import { adminModules } from "./admin-menu";

export default function AdminPage() {
    return (
        <section className="admin-overview">
            <div className="admin-page-heading">
                <div>
                    <span className="admin-eyebrow">Admin workspace</span>
                    <h1>Admin Area</h1>
                    <p>Your operational tools and project workspaces, all in one place.</p>
                </div>
                <span className="admin-overview-badge"><FiGrid aria-hidden="true" /> 8 workspaces</span>
            </div>

            <div className="admin-module-grid">
                {adminModules.map(({ label, href, description, icon: Icon }, index) => (
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

import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

export type AdminSectionLink = {
    title: string;
    description: string;
    href: string;
};

export default function AdminSectionLanding({
    title,
    description,
    items,
}: {
    title: string;
    description: string;
    items: AdminSectionLink[];
}) {
    return (
        <section className="admin-module-page admin-section-landing">
            <div className="admin-page-heading">
                <div>
                    <span className="admin-eyebrow">Admin workspace</span>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
            </div>
            <div className="admin-module-grid">
                {items.map(({ title: itemTitle, description: itemDescription, href }) => (
                    <Link className="admin-module-card" href={href} key={href}>
                        <span className="admin-module-icon"><FiArrowUpRight aria-hidden="true" /></span>
                        <h2>{itemTitle}</h2>
                        <p>{itemDescription}</p>
                        <FiArrowUpRight className="admin-module-arrow" aria-hidden="true" />
                    </Link>
                ))}
            </div>
        </section>
    );
}
import { notFound } from "next/navigation";
import { FiTool } from "react-icons/fi";
import { adminModules } from "../admin-menu";

export default async function AdminModulePage({
    params,
}: {
    params: Promise<{ module: string }>;
}) {
    const { module } = await params;
    const item = adminModules.find(({ href }) => href === `/admin/${module}`);

    if (!item) {
        notFound();
    }

    return (
        <section className="admin-module-page">
            <div className="admin-page-heading">
                <div>
                    <span className="admin-eyebrow">Workspace module</span>
                    <h1>{item.label}</h1>
                    <p>{item.description}</p>
                </div>
            </div>
            <div className="admin-module-empty">
                <span className="admin-module-empty-icon"><FiTool aria-hidden="true" /></span>
                <h2>This module isn&apos;t set up yet</h2>
                <p>When this workspace is ready, its tools and information will appear here.</p>
            </div>
        </section>
    );
}

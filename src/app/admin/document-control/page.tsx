import AdminSectionLanding from "../admin-section-landing";

export default function DocumentControlPage() {
    return (
        <AdminSectionLanding
            title="Document Control"
            description="Browse controlled policies, method statements, processes and CoSHH documents."
            items={[
                { title: "Policies", description: "Policy documents and current issue references.", href: "/admin/document-control/policies" },
                { title: "Method Statements", description: "Controlled method statements and revisions.", href: "/admin/document-control/method-statements" },
                { title: "Processes", description: "Operational processes and forms.", href: "/admin/document-control/processes" },
                { title: "CoSHH", description: "Chemical safety assessments and issue dates.", href: "/admin/document-control/coshh" },
            ]}
        />
    );
}
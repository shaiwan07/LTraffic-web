import AdminWorkspace from "../admin-workspace";
import { siteInspections } from "../admin-workspace-config";

export default function SiteInspectionsPage() {
    return <AdminWorkspace config={siteInspections} />;
}
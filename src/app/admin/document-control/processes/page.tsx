import AdminWorkspace from "../../admin-workspace";
import { getDocumentCategoryConfig } from "../../admin-workspace-config";

export default function ProcessesPage() {
    return <AdminWorkspace config={getDocumentCategoryConfig("Processes")} />;
}
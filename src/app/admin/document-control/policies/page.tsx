import AdminWorkspace from "../../admin-workspace";
import { getDocumentCategoryConfig } from "../../admin-workspace-config";

export default function PoliciesPage() {
    return <AdminWorkspace config={getDocumentCategoryConfig("Policies")} />;
}
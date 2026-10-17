import AdminWorkspace from "../../admin-workspace";
import { getDocumentCategoryConfig } from "../../admin-workspace-config";

export default function MethodStatementsPage() {
    return <AdminWorkspace config={getDocumentCategoryConfig("Method statements")} />;
}
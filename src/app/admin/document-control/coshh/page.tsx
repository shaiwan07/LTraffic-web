import AdminWorkspace from "../../admin-workspace";
import { getDocumentCategoryConfig } from "../../admin-workspace-config";

export default function CoshhPage() {
    return <AdminWorkspace config={getDocumentCategoryConfig("CoSHH")} />;
}
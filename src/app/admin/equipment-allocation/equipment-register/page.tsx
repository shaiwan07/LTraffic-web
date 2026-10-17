import AdminWorkspace from "../../admin-workspace";
import { equipment } from "../../admin-workspace-config";

export default function EquipmentRegisterPage() {
    return <AdminWorkspace config={equipment} />;
}
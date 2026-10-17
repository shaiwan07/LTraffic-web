import AdminWorkspace from "../../admin-workspace";
import { vehicles } from "../../admin-workspace-config";

export default function VehicleRegisterPage() {
    return <AdminWorkspace config={vehicles} />;
}
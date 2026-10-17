import AdminWorkspace from "../../../admin-workspace";
import { vehicleMaintenance } from "../../../admin-workspace-config";

export default function VehicleMaintenancePage() {
    return <AdminWorkspace config={vehicleMaintenance} />;
}
import AdminWorkspace from "../admin-workspace";
import { vehicleInspections } from "../admin-workspace-config";

export default function VehicleInspectionsPage() {
    return <AdminWorkspace config={vehicleInspections} />;
}
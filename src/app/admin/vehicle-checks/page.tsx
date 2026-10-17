import AdminWorkspace from "../admin-workspace";
import { vehicleChecks } from "../admin-workspace-config";

export default function VehicleChecksPage() {
    return <AdminWorkspace config={vehicleChecks} />;
}
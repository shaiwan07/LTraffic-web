import AdminWorkspace from "../admin-workspace";
import { incidentRecords } from "../admin-workspace-config";

export default function ReportedIncidentsPage() {
    return <AdminWorkspace config={incidentRecords} />;
}
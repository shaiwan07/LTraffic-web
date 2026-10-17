import AdminWorkspace from "../admin-workspace";
import { employees } from "../admin-workspace-config";

export default function HrManagerPage() {
    return <AdminWorkspace config={employees} />;
}
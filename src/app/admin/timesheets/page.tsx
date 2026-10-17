import AdminWorkspace from "../admin-workspace";
import { timesheets } from "../admin-workspace-config";

export default function TimesheetsPage() {
    return <AdminWorkspace config={timesheets} />;
}
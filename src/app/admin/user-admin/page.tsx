import AdminWorkspace from "../admin-workspace";
import { userAccounts } from "../admin-workspace-config";

export default function UserAdminPage() {
    return <AdminWorkspace config={userAccounts} />;
}
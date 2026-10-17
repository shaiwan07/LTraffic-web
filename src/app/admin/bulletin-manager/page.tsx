import AdminWorkspace from "../admin-workspace";
import { bulletins } from "../admin-workspace-config";

export default function BulletinManagerPage() {
    return <AdminWorkspace config={bulletins} />;
}
import { AdminPage } from "../rates/AdminPage";
import { ScanUploader } from "./ScanUploader";

export default function Page() {
  return <AdminPage title="AI rate sync" render={async () => <ScanUploader />} />;
}

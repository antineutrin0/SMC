import AdminFirstAidRequests from "../../components/admin/AdminFirstAidRequests";
import { SectionHeader } from "../../components/shared";

export default function AdminFirstAidPage() {
  return (
    <div>
      <SectionHeader title="First Aid Requests" subtitle="first aid requests study tours" />
      <AdminFirstAidRequests/>
    </div>
  );
}

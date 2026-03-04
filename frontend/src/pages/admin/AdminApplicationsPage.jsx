import { ApplicationReviews } from '../../components/admin/ApplicationReviews';
import { SectionHeader } from '../../components/shared';
export default function AdminApplicationsPage() {
  return (<div><SectionHeader title="Medical Card Applications" subtitle="Review pending applications" /><ApplicationReviews /></div>);
}
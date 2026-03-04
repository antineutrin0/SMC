import { AdminStats } from '../../components/admin/AdminStats';
import { SectionHeader } from '../../components/shared';
export default function AdminOverviewPage() {
  return (<div><SectionHeader title="Administrator Dashboard" subtitle="SUST Medical Centre Management" /><AdminStats /></div>);
}
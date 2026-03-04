import { RosterManagement } from '../../components/admin/RosterManagement';
import { SectionHeader } from '../../components/shared';
export default function AdminRostersPage() {
  return (<div><SectionHeader title="Duty Rosters" subtitle="Schedule and manage shifts" /><RosterManagement /></div>);
}
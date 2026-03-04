import { PatientVisitHistory } from '../../components/patient/PatientVisitHistory';
import { SectionHeader } from '../../components/shared';
export default function PatientVisitsPage() {
  return (<div><SectionHeader title="Visit History" subtitle="Your consultation records" /><PatientVisitHistory /></div>);
}
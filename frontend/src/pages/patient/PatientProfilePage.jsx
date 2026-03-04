import { PatientProfile } from '../../components/patient/PatientProfile';
import { SectionHeader } from '../../components/shared';
export default function PatientProfilePage() {
  return (<div><SectionHeader title="My Medical Card" subtitle="Your healthcare profile" /><PatientProfile /></div>);
}
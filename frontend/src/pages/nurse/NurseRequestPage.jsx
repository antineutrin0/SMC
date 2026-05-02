import MedicineRequest from "../../components/nurse/MedicineRequest";
import { SectionHeader } from "../../components/shared";
export default function NurseRequestPage() {
  return (
    <div>
      <SectionHeader
        title="Nurse Dashboard"
        subtitle="Medicine dispensing portal"
      />
      <MedicineRequest />
    </div>
  );
}

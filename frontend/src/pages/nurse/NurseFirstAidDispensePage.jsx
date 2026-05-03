import { FirstAidDispense } from "../../components/nurse/FirstAidDispense";
import { SectionHeader } from "../../components/shared";

export default function NurseFirstAidDispensePage() {
  return (
    <div>
    <SectionHeader
            title="Nurse Dashboard"
            subtitle="First Aid Medicine dispensation history and records"
          />
      <FirstAidDispense />
    </div>
  );
}

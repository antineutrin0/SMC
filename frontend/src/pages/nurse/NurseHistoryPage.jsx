import { TokenHistory } from "../../components/nurse/TokenHistory";
import { SectionHeader } from "../../components/shared";

export default function NurseHistoryPage() {
  return (
    <div>
    <SectionHeader
            title="Nurse Dashboard"
            subtitle="Medicine dispensation history and records"
          />
      <TokenHistory />
    </div>
  );
}

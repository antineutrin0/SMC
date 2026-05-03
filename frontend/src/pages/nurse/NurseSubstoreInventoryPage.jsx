import SubstoreInventory from "../../components/nurse/SubstoreInventory";
import { SectionHeader } from "../../components/shared";

export default function NurseSubstoreInventoryPage() {
  return (
    <div>
    <SectionHeader
            title="Nurse Dashboard"
            subtitle="Medicine Substore Inventory and records"
          />
      <SubstoreInventory />
    </div>
  );
}

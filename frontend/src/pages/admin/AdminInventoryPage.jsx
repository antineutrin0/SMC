import InventoryTable from "../../components/pharmacist/InventoryTable";
import { SectionHeader } from "../../components/shared";
import { useFetch } from "../../hooks";
import { getPharmacistMedicines } from "../../services/api";

export default function AdminApplicationsPage() {
  const { data, loading, refetch } = useFetch(getPharmacistMedicines);
  const medicines = data?.data ?? [];
  return (
    <div>
      <SectionHeader title="Inventory" subtitle="inventory items" />
      <InventoryTable medicines={medicines} loading={loading} />
    </div>
  );
}

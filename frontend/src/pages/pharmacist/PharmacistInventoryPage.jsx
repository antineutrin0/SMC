import { MedicineInventory } from '../../components/pharmacist/MedicineInventory';
import { SectionHeader } from '../../components/shared';
export default function PharmacistInventoryPage() {
  return (<div><SectionHeader title="Medicine Inventory" subtitle="Manage stock levels" /><MedicineInventory /></div>);
}
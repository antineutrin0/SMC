import { TransactionHistory } from '../../components/pharmacist/TransactionHistory';
import { SectionHeader } from '../../components/shared';
export default function PharmacistTransactionsPage() {
  return (<div><SectionHeader title="Transactions" subtitle="Inventory in/out history" /><TransactionHistory /></div>);
}
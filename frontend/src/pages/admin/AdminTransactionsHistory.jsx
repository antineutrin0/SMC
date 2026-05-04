import { TransactionHistory } from "../../components/pharmacist/TransactionHistory";
import { SectionHeader } from "../../components/shared";

export default function AdminTransactionsHistory() {
  return (
    <div>
      <SectionHeader
        title="Transactions History"
        subtitle="transaction records"
      />
      <TransactionHistory />
    </div>
  );
}

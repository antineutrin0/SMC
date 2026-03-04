import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { TrendingUp } from "lucide-react";
import { useFetch } from "../../hooks";
import { getTransactions } from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";

export function TransactionHistory() {
  const { data, loading } = useFetch(getTransactions);
  const transactions = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medicine Transactions</CardTitle>
        <CardDescription>Stock in/out history</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner className="py-10" />
        ) : (
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Reference
                  </TableHead>
                  <TableHead className="hidden md:table-cell">By</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {t.transaction_date
                        ? new Date(t.transaction_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {t.medicine_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.transaction_type === "IN" ? "default" : "secondary"
                        }
                      >
                        {t.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.quantity}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {t.reference_type}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {t.employee_name}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {t.balance_after}
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState icon={TrendingUp} title="No transactions" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        )}
      </CardContent>
    </Card>
  );
}

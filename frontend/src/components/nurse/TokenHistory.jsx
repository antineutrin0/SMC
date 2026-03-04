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
import { History, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch } from "../../hooks";
import { getNurseHistory } from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";

export function TokenHistory() {
  const { user } = useAuth();
  console.log(user);
  const { data, loading } = useFetch(
    user ? () => getNurseHistory(user.employee_id) : null,
  );
  const history = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispensation History</CardTitle>
        <CardDescription>
          A log of recently dispensed medicines.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner className="py-10" />
        ) : (
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Medicine
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Quantity
                  </TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((item) => (
                    <TableRow
                      key={`${item.token_id}-${item.medicine_name}-${item.dispensed_time}`}
                    >
                      <TableCell>
                        <Badge>#{item.token_id}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.patient_name}
                        <div className="text-xs text-muted-foreground font-mono">
                          {item.card_id}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.medicine_name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.quantity_dispensed}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.dispensed_time).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        icon={History}
                        title="No history found"
                        description="You have not dispensed any medicines yet."
                      />
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

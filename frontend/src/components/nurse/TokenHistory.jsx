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
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function TokenHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  console.log("User", user);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    getNurseHistory(user.id)
      .then((res) => {
        setHistory(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch history:", err);
        toast.error("Failed to load history");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);
  console.log("History Data", history);

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
                  <TableHead>Doctor</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Medicines Dispensed
                  </TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((item) => (
                    <TableRow key={item.token_uuid}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{item.token_uuid}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.patient_name}
                        <div className="text-xs text-muted-foreground font-mono">
                          {item.card_id}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.doctor_name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1">
                          {item.items?.map((med, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">
                                {med.medicine_name}
                              </span>
                              <span className="text-muted-foreground ml-1">
                                ({med.quantity})
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.issued_time).toLocaleString([], {
                            dateStyle: "medium",
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

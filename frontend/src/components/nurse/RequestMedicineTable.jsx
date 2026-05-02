import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Clock, History } from "lucide-react";
import { TableWrapper, EmptyState, getStatusVariant } from "../shared";

export function RequestMedicineTable({ history }) {
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString([], {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request Date</TableHead>
            <TableHead>Requested Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Decision Date</TableHead>
            <TableHead className="text-right">Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length > 0 ? (
            history.map((req) => (
              <TableRow key={req.request_id}>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatDate(req.request_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {req.items?.map((item, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-medium">
                          {item.medicine_name}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          (Qty: {item.quantity})
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(req.status)}>
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {req.status !== "PENDING"
                    ? formatDate(req.decision_date)
                    : "Waiting..."}
                </TableCell>
                <TableCell className="text-right text-xs max-w-[200px] truncate italic">
                  {req.admin_remarks || "No remarks"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5}>
                <EmptyState
                  icon={History}
                  title="No request history"
                  description="Your medicine stock requests will appear here."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}

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
    return new Date(date).toLocaleString([], {
      dateStyle: "short",
      timeStyle: "short",
    });
  };
  console.log("History in Table", history);
  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request Date</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Requested Items</TableHead>
            <TableHead>Status</TableHead>
            {/* <TableHead>Decision Date</TableHead> */}
            <TableHead className="text-right">Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length > 0 ? (
            history.map((req) => (
              <TableRow key={req.requisition_id}>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatDate(req.created_at)}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {req.requested_by_name || req.nurse_name || "—"}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {req.items?.map((item, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-medium">
                          {item.medicine_name}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          (Asked: {item.quantity_asked}
                          {req.status?.toUpperCase() === "PROCESSED" &&
                            `, Appr: ${item.quantity_approved}`}
                          )
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
                {/* <TableCell className="text-sm text-muted-foreground">
                  {req.status?.toUpperCase() !== "PENDING"
                    ? formatDate(req.decision_date)
                    : "Waiting..."}
                </TableCell> */}
                <TableCell className="text-right text-xs max-w-[200px] truncate italic">
                  {req.admin_remarks || "No remarks"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6}>
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

import { useState, useCallback } from "react";
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
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Ambulance } from "lucide-react";
import { useFetch, useDisclosure } from "../../hooks";
import {
  getAdminFirstAidRequests,
} from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";
import { FirstAidDetailDialog } from "./FirstAidDetailDialog";

const STATUS_BADGE = {
  PENDING:  "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
};

export function AdminFirstAidRequests() {
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState(null);
  const { isOpen, open, close } = useDisclosure();

  const { data, loading, refetch } = useFetch(getAdminFirstAidRequests);
  const all = data?.data ?? [];

  const pending  = all.filter((r) => r.statue === "PENDING");
  const resolved = all.filter((r) => r.statue !== "PENDING");
  const rows = tab === "pending" ? pending : resolved;

  const handleRowClick = (r) => {
    setSelected(r);
    open();
  };

  const handleClose = () => {
    close();
    setSelected(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>First Aid Requests</CardTitle>
              <CardDescription>
                Review and approve trip first-aid requests
              </CardDescription>
            </div>
            {/* Tab pills */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setTab("pending")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === "pending"
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending
                {pending.length > 0 && (
                  <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {pending.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("resolved")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === "resolved"
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Approved / Rejected
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Trip Details
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.request_id}
                      className="cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => handleRowClick(r)}
                    >
                      <TableCell className="font-mono text-xs">
                        {r.request_id}
                      </TableCell>
                      <TableCell className="font-medium">{r.fullname}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(r.request_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[220px] truncate">
                        {r.trip_details || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_BADGE[r.statue] ?? ""}
                        >
                          {r.statue}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState
                          icon={Ambulance}
                          title={
                            tab === "pending"
                              ? "No pending requests"
                              : "No resolved requests"
                          }
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

      <FirstAidDetailDialog
        requestSummary={selected}
        open={isOpen}
        onClose={handleClose}
        onActionComplete={refetch}
      />
    </>
  );
}

export default AdminFirstAidRequests;
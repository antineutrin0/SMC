import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Ambulance, Calendar } from "lucide-react";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";
import { FirstAidProcessDialog } from "./FirstAidProcessDialog";
import { getApprovedFirstAidRequests } from "../../services/api";

export function FirstAidRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [processed, setProcessed] = useState(new Set());

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getApprovedFirstAidRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleProcessed = (requestId) => {
    setProcessed((prev) => new Set([...prev, requestId]));
    setSelected(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>First Aid Requests</CardTitle>
          <CardDescription>
            Approved requests awaiting medicine allocation. Click a row to
            process.
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
                    <TableHead>Request ID</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Trip Details
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => {
                    const isProcessed = processed.has(r.request_id);
                    return (
                      <TableRow
                        key={r.request_id}
                        className="cursor-pointer hover:bg-muted/60 transition-colors"
                        onClick={() => !isProcessed && setSelected(r)}
                      >
                        <TableCell className="font-mono text-xs">
                          {r.request_id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.fullname}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(r.request_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                          {r.trip_details || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isProcessed
                                ? "border-gray-300 text-gray-500"
                                : "border-emerald-500 text-emerald-700"
                            }
                          >
                            {isProcessed ? "Processed" : "Approved"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessed}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isProcessed) setSelected(r);
                            }}
                            className={
                              isProcessed
                                ? "bg-gray-400 text-gray-800 border-gray-200"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }
                          >
                            {isProcessed ? "Done" : "Process"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          icon={Ambulance}
                          title="No approved requests"
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

      <FirstAidProcessDialog
        request={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onProcessed={handleProcessed}
      />
    </>
  );
}

export default FirstAidRequests;

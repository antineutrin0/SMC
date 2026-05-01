import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { LoadingSpinner, EmptyState, TableWrapper, getStatusVariant } from "../shared";
import { Backpack } from "lucide-react";

export default function RequestsTable({ loading, requests }) {
  if (loading) return <LoadingSpinner className="py-10" />;

  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Trip</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r.request_id}>
              <TableCell>#{r.request_id}</TableCell>
              <TableCell>{new Date(r.request_date).toLocaleDateString()}</TableCell>
              <TableCell>{r.trip_details}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(r.statue)}>{r.statue}</Badge>
              </TableCell>
              <TableCell>
                {r.items?.map((item, i) => (
                  <p key={i}>{item.medicine_name} ×{item.quantity}</p>
                ))}
              </TableCell>
            </TableRow>
          ))}

          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <EmptyState icon={Backpack} title="No requests" description="Submit one" />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export function FirstAidTable({ requests, onClick }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {requests.map((r) => (
          <TableRow
            key={r.request_id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onClick(r)}
          >
            <TableCell>#{r.request_id}</TableCell>
            <TableCell>{r.fullname}</TableCell>
            <TableCell>{r.statue}</TableCell>
            <TableCell>
              {new Date(r.processed_date).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
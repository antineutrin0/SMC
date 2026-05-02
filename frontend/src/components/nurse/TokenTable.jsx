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
import { Pill, Clock } from "lucide-react";
import { TableWrapper, EmptyState } from "../shared";

export function TokenTable({ tokens, onDispense, prescLoading }) {
  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead className="hidden sm:table-cell">Card ID</TableHead>
            <TableHead>Arrival Time</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((t) => (
            <TableRow key={t.token_id}>
              <TableCell>
                <Badge>#{t.token_id}</Badge>
              </TableCell>
              <TableCell className="font-medium">{t.patient_name}</TableCell>
              <TableCell className="hidden sm:table-cell font-mono text-xs">
                {t.card_id}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(t.issued_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  onClick={() => onDispense(t)}
                  disabled={prescLoading}
                >
                  <Pill className="w-3.5 h-3.5 mr-1.5" />
                  Dispense
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {tokens.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <EmptyState
                  icon={Pill}
                  title="No matching tokens"
                  description="No pending tokens found for your search."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}

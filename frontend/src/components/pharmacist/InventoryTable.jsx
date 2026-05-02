import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Pill } from "lucide-react";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";

function stockVariant(qty) {
  if (qty > 100) return "default";
  if (qty > 20) return "secondary";
  return "destructive";
}
function stockLabel(qty) {
  if (qty > 100) return "Good Stock";
  if (qty > 20) return "Low Stock";
  return "Critical";
}

export function InventoryTable({ medicines, loading }) {
  return (
    <>
      {loading ? (
        <LoadingSpinner className="py-10" />
      ) : (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Generic</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map((m) => (
                <TableRow key={m.medicine_id}>
                  <TableCell className="hidden sm:table-cell font-mono text-xs">
                    {m.medicine_id}
                  </TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {m.generic_name}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {m.catagory}
                  </TableCell>
                  <TableCell className="font-semibold">{m.total_quantity ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={stockVariant(m.total_quantity ?? 0)}>
                      {stockLabel(m.total_quantity ?? 0)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {medicines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      icon={Pill}
                      title="No medicines"
                      description="Add a medicine to get started"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      )}
    </>
  );
}

export default InventoryTable;

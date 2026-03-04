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
import { Pill } from "lucide-react";
import { useFetch } from "../../hooks";
import { getMedicines } from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";

function stockVariant(qty) {
  if (qty > 50) return "default";
  if (qty > 0) return "secondary";
  return "destructive";
}
function stockLabel(qty) {
  if (qty > 50) return "In Stock";
  if (qty > 0) return "Low Stock";
  return "Out of Stock";
}

export function MedicineList() {
  const { data: medicineres, loading } = useFetch(getMedicines);
  const medicines = medicineres?.data || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Medicines</CardTitle>
        <CardDescription>Current pharmacy inventory</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner className="py-10" />
        ) : (
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Generic Name
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Category
                  </TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.map((m) => (
                  <TableRow key={m.medicine_id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {m.generic_name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {m.catagory}
                    </TableCell>
                    <TableCell>{m.total_quantity ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={stockVariant(m.total_quantity ?? 0)}>
                        {stockLabel(m.total_quantity ?? 0)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {medicines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState icon={Pill} title="No medicines available" />
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

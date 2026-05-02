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
import { SearchBar, useSearch } from "../shared/SearchBar";

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

  // Filter by medicine name OR generic name
  const { query, setQuery, filtered } = useSearch(medicines, [
    (m) => m.name,
    (m) => m.generic_name,
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Available Medicines</CardTitle>
            <CardDescription>Current pharmacy inventory</CardDescription>
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name or generic…"
          />
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
                {filtered.map((m) => (
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
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        icon={Pill}
                        title={
                          query
                            ? `No medicines match "${query}"`
                            : "No medicines available"
                        }
                        description={
                          query ? "Try a different search term" : undefined
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
  );
}
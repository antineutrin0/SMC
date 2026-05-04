import { useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch } from "../../hooks";
import { getSubstoreInventory } from "../../services/api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";

import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";

import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";

import { Search, Pill } from "lucide-react";

export default function SubstoreInventory() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");

  const { data, loading } = useFetch(getSubstoreInventory);
  const inventory = data?.data || [];

  const filteredInventory = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return inventory.filter(
      (med) =>
        med.name?.toLowerCase().includes(query) ||
        med.generic_name?.toLowerCase().includes(query),
    );
  }, [inventory, searchQuery]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Substore Inventory</CardTitle>
        <CardDescription>
          View and manage available medicines in substore
        </CardDescription>

        {/* 🔍 Search */}
        <div className="relative max-w-sm mt-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by medicine or generic name..."
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                  <TableHead>Medicine</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredInventory.map((med, index) => (
                  <TableRow key={index}>
                    {/* Medicine Name */}
                    <TableCell className="font-medium flex items-center gap-2">
                      <Pill className="size-4 text-primary" />
                      {med.name}
                    </TableCell>

                    {/* Generic Name */}
                    <TableCell className="text-sm text-muted-foreground">
                      {med.generic_name}
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge variant="outline">
                        {med.catagory || med.category}
                      </Badge>
                    </TableCell>

                    {/* Quantity */}
                    <TableCell>
                      <Badge
                        variant={
                          med.quantity < 50
                            ? "destructive"
                            : med.quantity < 200
                              ? "secondary"
                              : "default"
                        }
                      >
                        {med.quantity}
                      </Badge>
                    </TableCell>

                    {/* Last Updated */}
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(med.last_updated).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}

                {filteredInventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        icon={Pill}
                        title="No medicines found"
                        description="Try adjusting your search"
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

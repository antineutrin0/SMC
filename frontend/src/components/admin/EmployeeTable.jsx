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
import { Users } from "lucide-react";
import { useFetch } from "../../hooks";
import { getEmployees } from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";

export function EmployeeTable() {
  const { data, loading } = useFetch(getEmployees);
  const employees = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Management</CardTitle>
        <CardDescription>All medical centre staff</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner className="py-10" />
        ) : (
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Specialization
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Contact
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.employee_id}>
                    <TableCell className="font-mono text-xs">
                      {emp.employee_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {emp.fullname}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{emp.designation}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {emp.specialization || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {emp.contact_no}
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.is_active ? "default" : "secondary"}>
                        {emp.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState icon={Users} title="No employees found" />
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

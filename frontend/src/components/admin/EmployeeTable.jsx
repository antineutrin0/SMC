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
import { Users, Plus } from "lucide-react";
import { useState } from "react";
import { useFetch, useDisclosure } from "../../hooks";
import { getEmployees } from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";
import { CreateEmployeeDialog } from "./CreateEmployeeDialog";
import { EmployeeDetailDialog } from "./EmployeeDetailDialog";

export function EmployeeTable() {
  const { data, loading, refetch } = useFetch(getEmployees);
  const createDisc = useDisclosure();
  const detailDisc = useDisclosure();
  const [selectedId, setSelectedId] = useState(null);
  const employees = data?.data ?? [];

  const handleRowClick = (emp) => {
    setSelectedId(emp.employee_id);
    detailDisc.open();
  };

  const handleDetailClose = () => {
    detailDisc.close();
    setSelectedId(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>All medical centre staff</CardDescription>
            </div>
            <Button size="sm" onClick={createDisc.open}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Employee
            </Button>
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
                    <TableRow
                      key={emp.employee_id}
                      className="cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => handleRowClick(emp)}
                    >
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
                        <Badge
                          variant={emp.is_active ? "default" : "secondary"}
                        >
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

      <CreateEmployeeDialog
        isOpen={createDisc.isOpen}
        onClose={createDisc.close}
        onSuccess={refetch}
      />

      <EmployeeDetailDialog
        employeeId={selectedId}
        open={detailDisc.isOpen}
        onClose={handleDetailClose}
        onSuccess={refetch}
      />
    </>
  );
}
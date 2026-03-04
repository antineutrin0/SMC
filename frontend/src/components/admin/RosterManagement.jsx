import { useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Plus, Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useForm, useDisclosure } from "../../hooks";
import {
  getRosters,
  createRoster,
  approveRoster,
  getEmployees,
} from "../../services/api";
import {
  LoadingSpinner,
  EmptyState,
  TableWrapper,
  getStatusVariant,
} from "../shared";

const INITIAL_FORM = {
  employeeId: "",
  dutyType: "Physical",
  startDate: "",
  endDate: "",
  shiftStart: "",
  shiftEnd: "",
};

export function RosterManagement() {
  const { user } = useAuth();
  const { isOpen, open, close } = useDisclosure();
  const { data: rosterres, loading, refetch } = useFetch(getRosters);
  const { data: employeesres } = useFetch(getEmployees);
  const { values: form, setValue, reset } = useForm(INITIAL_FORM);
  const rosters = rosterres?.data ?? [];
  const employees = employeesres?.data ?? [];
  const { mutate: submitRoster, loading: submitting } = useMutation(
    createRoster,
    {
      successMessage: "Roster created successfully",
      onSuccess: () => {
        close();
        reset();
        refetch();
      },
    },
  );

  const { mutate: approve } = useMutation(
    useCallback((id) => approveRoster(id, user.id), [user?.id]),
    { successMessage: "Roster approved", onSuccess: refetch },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.startDate || !form.endDate) return;
    submitRoster({ ...form, createdBy: user.id });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Duty Rosters</CardTitle>
            <CardDescription>Manage employee duty schedules</CardDescription>
          </div>
          <Button onClick={open} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Roster
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
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Designation
                  </TableHead>
                  <TableHead>Duty Type</TableHead>
                  <TableHead className="hidden md:table-cell">Period</TableHead>
                  <TableHead className="hidden lg:table-cell">Shift</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosters.map((r) => (
                  <TableRow key={r.roster_id}>
                    <TableCell className="font-medium">
                      {r.employee_name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{r.designation}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.duty_type}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(r.start_date).toLocaleDateString()} –{" "}
                      {new Date(r.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {r.shift_start} – {r.shift_end}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(r.status)}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "Draft" && (
                        <Button size="sm" onClick={() => approve(r.roster_id)}>
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {rosters.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState
                        icon={Calendar}
                        title="No rosters yet"
                        description="Create a duty roster to get started"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Create Duty Roster</DialogTitle>
            <DialogDescription>
              Schedule an employee&apos;s duty shift
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setValue("employeeId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.is_active)
                    .map((emp) => (
                      <SelectItem key={emp.employee_id} value={emp.employee_id}>
                        {emp.full_name} – {emp.designation}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Duty Type</Label>
              <Select
                value={form.dutyType}
                onValueChange={(v) => setValue("dutyType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Physical">Physical</SelectItem>
                  <SelectItem value="On Call">On Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setValue("startDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setValue("endDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Shift Start</Label>
                <Input
                  type="time"
                  value={form.shiftStart}
                  onChange={(e) => setValue("shiftStart", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Shift End</Label>
                <Input
                  type="time"
                  value={form.shiftEnd}
                  onChange={(e) => setValue("shiftEnd", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create Roster"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

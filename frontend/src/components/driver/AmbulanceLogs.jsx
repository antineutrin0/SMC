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
import { Ambulance, Plus, MapPin, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useForm, useDisclosure } from "../../hooks";
import {
  getAmbulanceLogs,
  createAmbulanceLog,
  completeTrip,
} from "../../services/api";
import { LoadingSpinner, EmptyState, StatsCard, TableWrapper } from "../shared";

function formatDT(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function calcDuration(dep, ret) {
  if (!dep || !ret) return null;
  const diff = Math.abs(new Date(ret) - new Date(dep));
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function AmbulanceLogs() {
  const { user } = useAuth();
  const { isOpen, open, close } = useDisclosure();

  const { data, loading, refetch } = useFetch(
    useCallback(() => getAmbulanceLogs(user?.employee_id), [user?.employee_id]),
    [user?.employee_id],
  );
  const logs = data?.data ?? [];

  const {
    values: form,
    setValue,
    reset,
  } = useForm({
    patientId: "",
    pickupLocation: "",
    destination: "",
    departureTime: "",
  });

  const { mutate: submit, loading: submitting } = useMutation(
    (data) => createAmbulanceLog({ ...data, driverId: user?.id }),
    {
      successMessage: "Ambulance log created",
      onSuccess: () => {
        close();
        reset();
        refetch();
      },
    },
  );

  const { mutate: endTrip } = useMutation(
    (id) => completeTrip(id, new Date().toISOString()),
    { successMessage: "Trip completed", onSuccess: refetch },
  );

  const activeCount = logs.filter((l) => !l.return_time).length;
  const doneCount = logs.filter((l) => l.return_time).length;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Ambulance Service</h3>
        <Button size="sm" onClick={open}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Log
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total"
          value={logs.length}
          icon={Ambulance}
          color="blue"
          loading={loading}
        />
        <StatsCard
          title="Active"
          value={activeCount}
          icon={MapPin}
          color="green"
          loading={loading}
        />
        <StatsCard
          title="Completed"
          value={doneCount}
          icon={CheckCircle}
          color="purple"
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Logs</CardTitle>
          <CardDescription>Ambulance trip history</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Pickup
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Destination
                    </TableHead>
                    <TableHead>Departed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.log_id}>
                      <TableCell className="font-mono text-xs">
                        #{log.log_id}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">
                          {log.patient_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.contact_number}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {log.pickup_location}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {log.destination}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDT(log.departure_time)}
                      </TableCell>
                      <TableCell>
                        {log.return_time ? (
                          <Badge variant="default">
                            Done{" "}
                            {calcDuration(
                              log.departure_time,
                              log.return_time,
                            ) &&
                              `· ${calcDuration(log.departure_time, log.return_time)}`}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!log.return_time && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => endTrip(log.log_id)}
                          >
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState
                          icon={Ambulance}
                          title="No logs yet"
                          description="Create a log when you start a trip"
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

      <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Ambulance Log</DialogTitle>
            <DialogDescription>Record a new service trip</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(form);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Patient Medical Card ID</Label>
              <Input
                placeholder="MC2024001"
                value={form.patientId}
                onChange={(e) => setValue("patientId", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pickup Location</Label>
              <Input
                placeholder="e.g. Hostel 3, Room 201"
                value={form.pickupLocation}
                onChange={(e) => setValue("pickupLocation", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Destination</Label>
              <Input
                placeholder="e.g. Sylhet MAG Osmani Medical"
                value={form.destination}
                onChange={(e) => setValue("destination", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Departure Time</Label>
              <Input
                type="datetime-local"
                value={form.departureTime}
                onChange={(e) => setValue("departureTime", e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create Log"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

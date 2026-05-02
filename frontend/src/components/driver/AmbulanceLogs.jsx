import { useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "../ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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

function calcTotalKms(initial, final) {
  if (initial == null || final == null) return null;
  const total = final - initial;
  return total >= 0 ? total : 0;
}

function validateKms(initial, final) {
  if (final != null && initial != null && final < initial) {
    return "Final KM must be greater than or equal to Initial KM";
  }
  return null;
}


export function AmbulanceLogs() {
  const { user } = useAuth();
  const { isOpen, open, close } = useDisclosure();

  const { data, loading, refetch } = useFetch(
    useCallback(() => getAmbulanceLogs(user?.id), [user?.id]),
    [user?.id]
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
    initial_kms: "",
  });

  const { mutate: submit, loading: submitting } = useMutation(
    (data) =>
      createAmbulanceLog({
        ...data,
        driverId: user?.id,
      }),
    {
      successMessage: "Ambulance log created",
      onSuccess: () => {
        close();
        reset();
        refetch();
      },
    }
  );


  const { mutate: endTrip } = useMutation(
    (id) => completeTrip(id, new Date().toISOString()),
    {
      successMessage: "Trip completed",
      onSuccess: refetch,
    }
  );

  const handleCompleteTrip = (logId) => {
    const returnTime = new Date().toISOString();
    endTrip(logId, returnTime);
  };



  const activeCount = logs.filter((l) => !l.return_time).length;
  const doneCount = logs.filter((l) => l.return_time).length;

 
  const handleSubmit = (e) => {
    e.preventDefault();

    submit({
      ...form,
      initial_kms: Number(form.initial_kms),
    });
  };

  // ======================
  // 🎨 UI
  // ======================

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Ambulance Service</h3>
        <Button size="sm" onClick={open}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Log
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total" value={logs.length} icon={Ambulance} />
        <StatsCard title="Active" value={activeCount} icon={MapPin} />
        <StatsCard title="Completed" value={doneCount} icon={CheckCircle} />
      </div>

      {/* Table */}
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
                    <TableHead>Driver</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Return</TableHead>
                    <TableHead>Initial KM</TableHead>
                    <TableHead>Final KM</TableHead>
                    <TableHead>Total KM</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {logs.map((log) => {
                    const totalKms = calcTotalKms(
                      log.initial_kms,
                      log.final_kms
                    );

                    return (
                      <TableRow key={log.log_id}>
                        <TableCell>#{log.log_id}</TableCell>

                        <TableCell>
                          {log.patient_name}
                        </TableCell>

                        <TableCell>
                          {log.driver_name}
                        </TableCell>

                        <TableCell>{log.pickup_location}</TableCell>
                        <TableCell>{log.destination}</TableCell>

                        <TableCell>
                          {formatDT(log.departure_time)}
                        </TableCell>

                        <TableCell>
                          {formatDT(log.return_time)}
                        </TableCell>

                        <TableCell>
                          {log.initial_kms ?? "—"}
                        </TableCell>

                        <TableCell>
                          {log.final_kms ?? "—"}
                        </TableCell>

                        <TableCell>
                          {totalKms ?? "—"}
                        </TableCell>

                        <TableCell>
                          {log.return_time ? (
                            <Badge>
                              Done{" "}
                              {calcDuration(
                                log.departure_time,
                                log.return_time
                              ) &&
                                `· ${calcDuration(
                                  log.departure_time,
                                  log.return_time
                                )}`}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              In Progress
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {!log.return_time && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleCompleteTrip(log.log_id)
                              }
                            >
                              Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12}>
                        <EmptyState title="No logs yet" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableWrapper>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Ambulance Log</DialogTitle>
            <DialogDescription>
              Record a new trip
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Patient ID</Label>
              <Input
                value={form.patientId}
                onChange={(e) =>
                  setValue("patientId", e.target.value)
                }
                required
              />
            </div>

            <div>
              <Label>Pickup Location</Label>
              <Input
                value={form.pickupLocation}
                onChange={(e) =>
                  setValue("pickupLocation", e.target.value)
                }
                required
              />
            </div>

            <div>
              <Label>Destination</Label>
              <Input
                value={form.destination}
                onChange={(e) =>
                  setValue("destination", e.target.value)
                }
                required
              />
            </div>

            <div>
              <Label>Departure Time</Label>
              <Input
                type="datetime-local"
                value={form.departureTime}
                onChange={(e) =>
                  setValue("departureTime", e.target.value)
                }
              />
            </div>

            <div>
              <Label>Initial KM</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={form.initial_kms}
                onChange={(e) =>
                  setValue("initial_kms", e.target.value)
                }
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" onClick={close}>
                Cancel
              </Button>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
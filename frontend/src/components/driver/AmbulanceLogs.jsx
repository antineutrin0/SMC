import { useCallback, useState } from "react";
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

// ── Helpers ───────────────────────────────────────────────────
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
  return total >= 0 ? total.toFixed(1) : 0;
}

// ── Complete Trip Dialog ───────────────────────────────────────
function CompleteTripDialog({ log, open, onClose, onConfirm, loading }) {
  const [finalKms, setFinalKms] = useState("");
  const [error, setError]       = useState("");

  const initialKms = log?.initial_kms ?? 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(finalKms);

    if (isNaN(val)) {
      setError("Please enter a valid number.");
      return;
    }
    if (val < initialKms) {
      setError(`Final KM must be ≥ Initial KM (${initialKms})`);
      return;
    }

    setError("");
    onConfirm(log.log_id, val);
  };

  // Reset local state when dialog opens for a new log
  const handleOpenChange = (v) => {
    if (!v) {
      setFinalKms("");
      setError("");
      onClose();
    }
  };

  const totalKms =
    finalKms !== "" && !isNaN(parseFloat(finalKms))
      ? Math.max(0, parseFloat(finalKms) - initialKms).toFixed(1)
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Complete Trip</DialogTitle>
          <DialogDescription>
            Log #{log?.log_id} — enter the odometer reading at trip end.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-only initial KM */}
          <div className="space-y-1.5">
            <Label>Initial KM (start reading)</Label>
            <Input value={initialKms} readOnly className="bg-muted" />
          </div>

          {/* Final KM input */}
          <div className="space-y-1.5">
            <Label>Final KM (end reading)</Label>
            <Input
              type="number"
              min={initialKms}
              step="0.1"
              placeholder={`≥ ${initialKms}`}
              value={finalKms}
              onChange={(e) => {
                setFinalKms(e.target.value);
                setError("");
              }}
              required
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          {/* Live total preview */}
          {totalKms !== null && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">Total distance: </span>
              <span className="font-semibold">{totalKms} km</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Complete Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────
export function AmbulanceLogs() {
  const { user } = useAuth();

  // New log dialog
  const { isOpen, open, close } = useDisclosure();

  // Complete trip dialog
  const [completingLog, setCompletingLog] = useState(null); // the log being completed

  const { data, loading, refetch } = useFetch(
    useCallback(() => getAmbulanceLogs(user?.id), [user?.id]),
    [user?.id],
  );
  const logs = data?.data ?? [];

  // ── New log form ────────────────────────────────────────────
  const { values: form, setValue, reset } = useForm({
    patientId:       "",
    pickupLocation:  "",
    destination:     "",
    departureTime:   "",
    initialKms:      "",   // ← consistent camelCase throughout
  });

  const { mutate: submit, loading: submitting } = useMutation(
    (payload) => createAmbulanceLog({ ...payload, driverId: user?.id }),
    {
      successMessage: "Ambulance log created",
      onSuccess: () => {
        close();
        reset();
        refetch();
      },
    },
  );

  // ── Complete trip mutation ───────────────────────────────────
  const { mutate: endTrip, loading: completing } = useMutation(
    // Backend: PATCH /api/driver/logs/:logId/complete
    // Body: { returnTime, finalKms }
    ({ logId, finalKms }) =>
      completeTrip(logId, 
         new Date().toISOString(),
         Number(finalKms),
      ),
    {
      successMessage: "Trip completed",
      onSuccess: () => {
        setCompletingLog(null);
        refetch();
      },
    },
  );

  // ── Handlers ────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    submit({
      patientId:      form.patientId,
      pickupLocation: form.pickupLocation,
      destination:    form.destination,
      departureTime:  form.departureTime || undefined,
      initialKms:     Number(form.initialKms),  // ← correct field name
    });
  };

  const handleConfirmComplete = (logId, finalKms) => {
    endTrip({ logId, finalKms });
  };

  // ── Stats ───────────────────────────────────────────────────
  const activeCount = logs.filter((l) => !l.return_time).length;
  const doneCount   = logs.filter((l) =>  l.return_time).length;

  // ── Render ───────────────────────────────────────────────────
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
        <StatsCard title="Total"     value={logs.length}  icon={Ambulance}    />
        <StatsCard title="Active"    value={activeCount}  icon={MapPin}       />
        <StatsCard title="Completed" value={doneCount}    icon={CheckCircle}  />
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
                    // FIX: API returns snake_case — use initial_kms / final_kms
                    const totalKms = calcTotalKms(log.initial_kms, log.final_kms);

                    return (
                      <TableRow key={log.log_id}>
                        <TableCell className="font-mono text-xs">
                          #{log.log_id}
                        </TableCell>
                        <TableCell>{log.patient_name}</TableCell>
                        <TableCell>{log.driver_name ?? "—"}</TableCell>
                        <TableCell>{log.pickup_location}</TableCell>
                        <TableCell>{log.destination}</TableCell>
                        <TableCell>{formatDT(log.departure_time)}</TableCell>
                        <TableCell>{formatDT(log.return_time)}</TableCell>

                        {/* FIX: was log.initialKms (undefined), now log.initial_kms */}
                        <TableCell>
                          {log.initial_kms != null ? log.initial_kms : "—"}
                        </TableCell>

                        {/* FIX: was log.final_kms already correct, keeping consistent */}
                        <TableCell>
                          {log.final_kms != null ? log.final_kms : "—"}
                        </TableCell>

                        <TableCell>
                          {totalKms != null ? `${totalKms} km` : "—"}
                        </TableCell>

                        <TableCell>
                          {log.return_time ? (
                            <Badge>
                              Done
                              {calcDuration(log.departure_time, log.return_time) &&
                                ` · ${calcDuration(log.departure_time, log.return_time)}`}
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
                              onClick={() => setCompletingLog(log)}
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
                        <EmptyState
                          icon={Ambulance}
                          title="No logs yet"
                          description="Create a new ambulance log to get started"
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

      {/* ── New Log Dialog ───────────────────────────────────── */}
      <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Ambulance Log</DialogTitle>
            <DialogDescription>Record a new trip</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Patient Card ID</Label>
              <Input
                placeholder="MC2023001"
                value={form.patientId}
                onChange={(e) => setValue("patientId", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Pickup Location</Label>
              <Input
                placeholder="e.g. Dhaka Medical College"
                value={form.pickupLocation}
                onChange={(e) => setValue("pickupLocation", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Destination</Label>
              <Input
                placeholder="e.g. Savar Hospital"
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

            <div className="space-y-1.5">
              <Label>Initial KM</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 120.5"
                // FIX: was form.initialkms (undefined) — now form.initialKms
                value={form.initialKms}
                onChange={(e) => setValue("initialKms", e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Complete Trip Dialog ─────────────────────────────── */}
      <CompleteTripDialog
        log={completingLog}
        open={!!completingLog}
        onClose={() => setCompletingLog(null)}
        onConfirm={handleConfirmComplete}
        loading={completing}
      />
    </>
  );
}
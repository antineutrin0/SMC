import { useState, useCallback } from "react";
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
import { Textarea } from "../ui/textarea";
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
import { Plus, Trash2, Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useForm, useDisclosure } from "../../hooks";
import {
  getDoctorVisits,
  createVisit,
  createPrescription,
  getMedicines,
} from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";
import { PrescriptionDialog } from "../shared/PrescriptionDialog";

// ── Constants ─────────────────────────────────────────────────
const EMPTY_MED = {
  medicineId: "",
  dosageAmount: "",
  dosageUnit: "mg",
  durationDay: "",
  frequency: "",
};

// ── MedicationRow ─────────────────────────────────────────────
function MedicationRow({ med, index, medicines, onChange, onRemove }) {
  return (
    <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Medicine</Label>
          <Select
            value={med.medicineId}
            onValueChange={(v) => onChange(index, "medicineId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select medicine" />
            </SelectTrigger>
            <SelectContent>
              {medicines.map((m) => (
                <SelectItem key={m.medicine_id} value={String(m.medicine_id)}>
                  {m.name} ({m.total_quantity ?? 0} left)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Dosage</Label>
            <Input
              type="number"
              placeholder="500"
              value={med.dosageAmount}
              onChange={(e) => onChange(index, "dosageAmount", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Unit</Label>
            <Select
              value={med.dosageUnit}
              onValueChange={(v) => onChange(index, "dosageUnit", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mg">mg</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="unit">unit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Duration (days)</Label>
          <Input
            type="number"
            placeholder="7"
            value={med.durationDay}
            onChange={(e) => onChange(index, "durationDay", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Frequency/day</Label>
          <Input
            type="number"
            placeholder="3"
            value={med.frequency}
            onChange={(e) => onChange(index, "frequency", e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── DoctorVisits ──────────────────────────────────────────────
export function DoctorVisits() {
  const { user } = useAuth();

  // Modal states
  const visitModal = useDisclosure();   // New visit dialog
  const prescModal = useDisclosure();   // Create prescription dialog
  const viewModal = useDisclosure();    // View prescription dialog (read-only)

  // Selected visit for each dialog — kept separate to avoid conflicts
  const [rxVisit, setRxVisit] = useState(null);       // for create Rx
  const [viewVisit, setViewVisit] = useState(null);   // for view Rx

  const [medications, setMedications] = useState([]);

  // ── Data fetching ───────────────────────────────────────────
  const { data: visitsRes, loading, refetch } = useFetch(
    useCallback(() => {
      if (!user?.id) return Promise.resolve(null);
      return getDoctorVisits(user.id);
    }, [user?.id]),
  );
  const visits = visitsRes?.data || [];

  const { data: medicineRes } = useFetch(getMedicines);
  const medicines = medicineRes?.data || [];

  // ── Forms ───────────────────────────────────────────────────
  const { values: visitForm, setValue: setVF, reset: resetVF } = useForm({
    cardId: "",
  });
  const { values: rxForm, setValue: setRx, reset: resetRx } = useForm({
    symptoms: "",
    advice: "",
  });

  // ── Mutations ───────────────────────────────────────────────
  const { mutate: submitVisit, loading: visitLoading } = useMutation(
    createVisit,
    {
      onSuccess: (result) => {
        if (result?.success) {
          visitModal.close();
          resetVF();
          // Immediately open the prescription dialog for the new visit
          setRxVisit({
            visit_id: result.data.visitId,
            card_id: visitForm.cardId,
          });
          prescModal.open();
          refetch();
        }
      },
    },
  );

  const { mutate: submitRx, loading: rxLoading } = useMutation(
    createPrescription,
    {
      successMessage: "Prescription created",
      onSuccess: () => {
        prescModal.close();
        resetRx();
        setMedications([]);
        setRxVisit(null);
        refetch();
      },
    },
  );

  // ── Handlers ────────────────────────────────────────────────
  const handleVisitSubmit = (e) => {
    e.preventDefault();
    submitVisit({ cardId: visitForm.cardId, doctorId: user.id });
  };

  const handleRxSubmit = (e) => {
    e.preventDefault();
    submitRx({
      visitId: rxVisit.visit_id,
      symptoms: rxForm.symptoms,
      advice: rxForm.advice,
      medications: medications.map((m) => ({
        medicineId: m.medicineId,
        dosageAmount: m.dosageAmount,
        dosageUnit: m.dosageUnit,
        durationDay: m.durationDay,
        frequency: m.frequency,
      })),
    });
  };

  const handleAddRx = (visit) => {
    setRxVisit(visit);
    prescModal.open();
  };

  // Row click — only opens view dialog for completed visits
  const handleRowClick = (visit) => {
    if (!visit.symptoms) return; // incomplete visits have no prescription to view
    setViewVisit(visit);
    viewModal.open();
  };

  const updateMed = (i, field, val) => {
    setMedications((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)),
    );
  };

  const closeRxModal = () => {
    prescModal.close();
    resetRx();
    setMedications([]);
    setRxVisit(null);
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Patient Visits</h3>
        <Button onClick={visitModal.open} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          New Visit
        </Button>
      </div>

      {/* ── Consultation History Table ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Consultation History</CardTitle>
          <CardDescription>
            All patient visits you have handled. Click a completed row to view
            prescription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Card ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Symptoms
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Advice
                    </TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((v) => (
                    <TableRow
                      key={v.visit_id}
                      // Only completed visits are clickable
                      className={
                        v.symptoms
                          ? "cursor-pointer hover:bg-muted/60 transition-colors"
                          : undefined
                      }
                      onClick={() => handleRowClick(v)}
                    >
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(v.visit_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {v.card_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {v.patient_name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[160px] truncate">
                        {v.symptoms || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[160px] truncate">
                        {v.advice || "—"}
                      </TableCell>
                      <TableCell>
                        {!v.symptoms ? (
                          <Button
                            size="sm"
                            variant="outline"
                            // Stop propagation so row click doesn't fire
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddRx(v);
                            }}
                          >
                            Add Rx
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Done
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {visits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState icon={Calendar} title="No visits yet" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableWrapper>
          )}
        </CardContent>
      </Card>

      {/* ── New Visit Dialog ────────────────────────────────── */}
      <Dialog
        open={visitModal.isOpen}
        onOpenChange={(v) => !v && visitModal.close()}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Patient Visit</DialogTitle>
            <DialogDescription>
              Enter the patient&apos;s medical card ID
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVisitSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Medical Card ID</Label>
              <Input
                placeholder="MC2024001"
                value={visitForm.cardId}
                onChange={(e) => setVF("cardId", e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={visitModal.close}>
                Cancel
              </Button>
              <Button type="submit" disabled={visitLoading}>
                {visitLoading ? "Creating…" : "Create Visit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Create Prescription Dialog ──────────────────────── */}
      <Dialog open={prescModal.isOpen} onOpenChange={(v) => !v && closeRxModal()}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Prescription</DialogTitle>
            <DialogDescription>
              Patient: {rxVisit?.patient_name || rxVisit?.card_id}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRxSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Symptoms / Chief Complaints</Label>
              <Textarea
                rows={3}
                placeholder="Describe patient symptoms…"
                value={rxForm.symptoms}
                onChange={(e) => setRx("symptoms", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Advice / Investigations</Label>
              <Textarea
                rows={2}
                placeholder="Tests recommended, follow-up advice…"
                value={rxForm.advice}
                onChange={(e) => setRx("advice", e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Medications (Rx)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setMedications((prev) => [...prev, { ...EMPTY_MED }])
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Medicine
                </Button>
              </div>
              <div className="space-y-3">
                {medications.map((med, i) => (
                  <MedicationRow
                    key={i}
                    med={med}
                    index={i}
                    medicines={medicines}
                    onChange={updateMed}
                    onRemove={(idx) =>
                      setMedications((p) => p.filter((_, j) => j !== idx))
                    }
                  />
                ))}
                {medications.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3 border-2 border-dashed rounded-lg">
                    No medicines added yet
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeRxModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={rxLoading}>
                {rxLoading ? "Saving…" : "Create Prescription"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── View Prescription Dialog (read-only) ────────────── */}
      <PrescriptionDialog
        visit={viewVisit}
        open={viewModal.isOpen}
        onClose={() => {
          viewModal.close();
          setViewVisit(null);
        }}
      />
    </>
  );
}
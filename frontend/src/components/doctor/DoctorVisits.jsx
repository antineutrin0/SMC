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
import { Plus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useForm, useDisclosure } from "../../hooks";
import {
  getDoctorVisits,
  createVisit,
  createPrescription,
  getMedicines,
} from "../../services/api";
import MedicationRow from "./MedicationRow";
import VisitsTable from "./VisitsTable";
import { PrescriptionDialog } from "../shared/PrescriptionDialog";

// ── Constants ─────────────────────────────────────────────────
const EMPTY_MED = {
  medicineId: "",
  dosageAmount: "",
  dosageUnit: "mg",
  durationDay: 1,
  frequency: 1,
};

// ── DoctorVisits ──────────────────────────────────────────────
export function DoctorVisits() {
  const { user } = useAuth();

  // Modal states
  const visitModal = useDisclosure();
  const prescModal = useDisclosure();
  const viewModal  = useDisclosure();

  const [rxVisit,   setRxVisit]   = useState(null);
  const [viewVisit, setViewVisit] = useState(null);
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
        medicineId:   m.medicineId,
        dosageAmount: m.dosageAmount,
        dosageUnit:   m.dosageUnit,
        durationDay:  m.durationDay,
        frequency:    m.frequency,
      })),
    });
  };

  const handleAddRx = (visit) => {
    setRxVisit(visit);
    prescModal.open();
  };

  // Row click — enrich the visit with doctor info from auth context
  // so PrescriptionDialog always has doctor_name + doctor_specialization
  const handleRowClick = (visit) => {
    if (!visit.symptoms) return;
    setViewVisit({
      ...visit,
      // visit rows from getDoctorVisits may not carry doctor fields —
      // inject them from the logged-in user object
      doctor_name:           visit.doctor_name           ?? user?.name,
      doctor_specialization: visit.doctor_specialization ?? user?.specialization,
    });
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

      <VisitsTable
        visits={visits}
        loading={loading}
        handleRowClick={handleRowClick}
        handleAddRx={handleAddRx}
      />

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
      <Dialog
        open={prescModal.isOpen}
        onOpenChange={(v) => !v && closeRxModal()}
      >
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

            {/* Medications */}
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
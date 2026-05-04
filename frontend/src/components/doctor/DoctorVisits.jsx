import { useState, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "../ui/dialog";
import {
  Plus, User, Clock, ChevronLeft, ChevronRight, Stethoscope,
  Droplets, Ruler, Weight, Phone, Calendar,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useForm, useDisclosure } from "../../hooks";
import {
  getDoctorVisits, createVisit, createPrescription, getMedicines,
  getPatientProfileForDoctor, getPatientVisitsForDoctor,
  getDoctorPrescription,
} from "../../services/api";
import MedicationRow from "./MedicationRow";
import VisitsTable from "./VisitsTable";
import { LoadingSpinner } from "../shared";
import { PrescriptionDialog } from "../shared/PrescriptionDialog";
import { TokenDialog } from "./TokenDialog";

const EMPTY_MED = {
  medicineId: "", dosageAmount: "", dosageUnit: "mg", durationDay: 1, frequency: 1,
};

// ── Patient info chip ─────────────────────────────────────────
function InfoChip({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ── Patient Panel (profile + history tabs) ────────────────────
function PatientPanel({ cardId }) {
  const [tab, setTab] = useState("profile");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [prescOpen, setPrescOpen] = useState(false);

  const { data: profileRes, loading: profileLoading } = useFetch(
    useCallback(() => getPatientProfileForDoctor(cardId), [cardId]),
  );
  const { data: visitsRes, loading: visitsLoading } = useFetch(
    useCallback(() => getPatientVisitsForDoctor(cardId), [cardId]),
  );

  const profile = profileRes?.data ?? null;
  const visits  = visitsRes?.data  ?? [];

  const age = profile?.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth)) / 31557600000)
    : null;

  const handleVisitClick = (v) => {
    if (!v.symptoms) return; // no prescription yet
    setSelectedVisit(v);
    setPrescOpen(true);
  };

  return (
    <>
      <div className="rounded-lg border bg-muted/30 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b bg-white">
          {["profile", "history"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors capitalize
                ${tab === t
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "profile" ? "Patient Profile" : "Visit History"}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === "profile" && (
          <div className="p-4">
            {profileLoading ? (
              <LoadingSpinner className="py-6" />
            ) : profile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shrink-0">
                    {profile.fullname?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{profile.fullname}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{profile.type}</Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          profile.Status === "Active"
                            ? "border-emerald-400 text-emerald-700"
                            : "border-red-400 text-red-700"
                        }`}
                      >
                        {profile.Status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <InfoChip icon={Droplets} label="Blood"   value={profile.BloodGroup} />
                  <InfoChip icon={Ruler}    label="Height"  value={profile.Height_cm ? `${profile.Height_cm} cm` : null} />
                  <InfoChip icon={Weight}   label="Weight"  value={profile.Weight_kg  ? `${profile.Weight_kg} kg`  : null} />
                  <InfoChip icon={Calendar} label="Age"     value={age ? `${age} yrs` : null} />
                  <InfoChip icon={Phone}    label="Contact" value={profile.contact_number} />
                </div>

                <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                  <p>Card ID: <span className="font-mono font-medium text-foreground">{profile.CardID}</span></p>
                  <p>
                    Valid:{" "}
                    <span className="text-foreground">
                      {new Date(profile.IssueDate).toLocaleDateString()} →{" "}
                      {new Date(profile.ExpiryDate).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Profile unavailable</p>
            )}
          </div>
        )}

        {/* History tab */}
        {tab === "history" && (
          <div className="p-4">
            {visitsLoading ? (
              <LoadingSpinner className="py-6" />
            ) : visits.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {visits.map((v) => (
                  <div
                    key={v.visit_id}
                    onClick={() => handleVisitClick(v)}
                    className={`rounded-md border bg-white p-3 text-sm transition-colors
                      ${v.symptoms
                        ? "cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                        : "opacity-60"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {new Date(v.visit_date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{v.doctor_name}</span>
                        {v.symptoms && (
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                            Rx
                          </Badge>
                        )}
                      </div>
                    </div>
                    {v.symptoms && (
                      <p className="text-xs text-muted-foreground truncate">{v.symptoms}</p>
                    )}
                    {!v.symptoms && (
                      <p className="text-xs text-muted-foreground italic">No prescription</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No previous visits</p>
            )}
          </div>
        )}
      </div>

      {/* Prescription viewer — rendered outside the panel card to avoid z-index issues */}
      <PrescriptionDialog
        visit={selectedVisit}
        open={prescOpen}
        onClose={() => { setPrescOpen(false); setSelectedVisit(null); }}
        fetchFn={selectedVisit ? () => getDoctorPrescription(selectedVisit.visit_id) : null}
      />
    </>
  );
}

// ── Main component ────────────────────────────────────────────
export function DoctorVisits() {
  const { user } = useAuth();

  const visitModal = useDisclosure();
  const prescModal = useDisclosure();
  const viewModal  = useDisclosure();
  const tokenModal = useDisclosure();

  const [rxVisit,    setRxVisit]    = useState(null);
  const [viewVisit,  setViewVisit]  = useState(null);
  const [tokenVisit, setTokenVisit] = useState(null);
  const [medications, setMedications] = useState([]);
  // track which panel is shown: "patient" | "prescription"
  const [prescStep, setPrescStep] = useState("patient");

  const { data: visitsRes, loading, refetch } = useFetch(
    useCallback(() => {
      if (!user?.id) return Promise.resolve(null);
      return getDoctorVisits(user.id);
    }, [user?.id]),
  );
  const visits = visitsRes?.data || [];

  const { data: medicineRes } = useFetch(getMedicines);
  const medicines = medicineRes?.data || [];

  const { values: visitForm, setValue: setVF, reset: resetVF } = useForm({ cardId: "" });
  const { values: rxForm, setValue: setRx, reset: resetRx } = useForm({
    symptoms: "", advice: "",
  });

  const { mutate: submitVisit, loading: visitLoading } = useMutation(createVisit, {
    onSuccess: (result) => {
      if (result?.success) {
        visitModal.close();
        const newVisit = {
          visit_id: result.data.visitId,
          card_id: visitForm.cardId,
        };
        setRxVisit(newVisit);
        setPrescStep("patient"); // start on patient panel
        resetVF();
        prescModal.open();
        refetch();
      }
    },
  });

  const { mutate: submitRx, loading: rxLoading } = useMutation(createPrescription, {
    successMessage: "Prescription created",
    onSuccess: (result) => {
      prescModal.close();
      resetRx();
      setMedications([]);
      // auto-open token dialog
      setTokenVisit(rxVisit);
      setRxVisit(null);
      setPrescStep("patient");
      tokenModal.open();
      refetch();
    },
  });

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
    setPrescStep("patient");
    prescModal.open();
  };

  const handleRowClick = (visit) => {
    if (!visit.symptoms) return;
    setViewVisit({
      ...visit,
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
    setPrescStep("patient");
  };

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

      {/* ── New Visit Dialog ── */}
      <Dialog open={visitModal.isOpen} onOpenChange={(v) => !v && visitModal.close()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Patient Visit</DialogTitle>
            <DialogDescription>Enter the patient's medical card ID</DialogDescription>
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
              <Button type="button" variant="outline" onClick={visitModal.close}>Cancel</Button>
              <Button type="submit" disabled={visitLoading}>
                {visitLoading ? "Creating…" : "Create Visit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Prescription Dialog (with patient panel) ── */}
      <Dialog open={prescModal.isOpen} onOpenChange={(v) => !v && closeRxModal()}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {prescStep === "patient" ? (
                <><User className="size-4" />Patient Overview</>
              ) : (
                <><Stethoscope className="size-4" />Create Prescription</>
              )}
            </DialogTitle>
            <DialogDescription>
              Card ID:{" "}
              <span className="font-mono font-medium">{rxVisit?.card_id}</span>
              {" · "}
              <span className="text-xs text-muted-foreground">
                Step {prescStep === "patient" ? "1" : "2"} of 2
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex gap-1 mb-2">
            {["patient", "prescription"].map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  prescStep === s ||
                  (s === "patient" && prescStep === "prescription")
                    ? "bg-blue-600"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* ── Step 1: Patient panel ── */}
          {prescStep === "patient" && rxVisit?.card_id && (
            <div className="space-y-4">
              <PatientPanel cardId={rxVisit.card_id} />
              <div className="flex justify-end">
                <Button onClick={() => setPrescStep("prescription")}>
                  Continue to Prescription
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Prescription form ── */}
          {prescStep === "prescription" && (
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
                    onClick={() => setMedications((prev) => [...prev, { ...EMPTY_MED }])}
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

              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPrescStep("patient")}
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Back to Patient
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeRxModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={rxLoading}>
                    {rxLoading ? "Saving…" : "Save & Issue Token"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── View Prescription Dialog (read-only) ── */}
      <PrescriptionDialog
        visit={viewVisit}
        open={viewModal.isOpen}
        onClose={() => { viewModal.close(); setViewVisit(null); }}
      />

      {/* ── Token Dialog (auto-opens after prescription) ── */}
      <TokenDialog
        visit={tokenVisit}
        open={tokenModal.isOpen}
        onClose={() => { tokenModal.close(); setTokenVisit(null); }}
        onCreated={() => { tokenModal.close(); setTokenVisit(null); refetch(); }}
      />
    </>
  );
}
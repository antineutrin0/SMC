import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Calendar,
  Pill,
  Clock,
  Hash,
  AlignLeft,
  User,
  Stethoscope,
  UserRound,
  Utensils,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { StatChip } from ".";

// ── Dummy prescription data (replace with API call later) ─────
const DUMMY_PRESCRIPTIONS = [
  {
    prescription_id: 1,
    medicine_name: "Amoxicillin",
    generic_name: "Amoxicillin Trihydrate",
    quantity: 21,
    unit: "pcs",
    dose: "500mg",
    frequency: "3 times/day",
    duration: "7 days",
  },
  {
    prescription_id: 2,
    medicine_name: "Napa Extra",
    generic_name: "Paracetamol + Caffeine",
    quantity: 10,
    unit: "pcs",
    dose: "1 tablet",
    frequency: "2 times/day",
    duration: "5 days",
  },
  {
    prescription_id: 3,
    medicine_name: "Omeprazole",
    generic_name: "Omeprazole 20mg",
    quantity: 14,
    unit: "pcs",
    dose: "20mg",
    frequency: "1 time/day",
    duration: "2 weeks",
  },
];

// ── Small info row used in the header card ─────────────────────
function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────
// Props:
//   visit   — the visit object. Expected fields (all optional):
//               visit_date, doctor_name, doctor_specialization,
//               patient_name, card_id, symptoms, advice
//   open    — boolean
//   onClose — () => void
export function PrescriptionDialog({ visit, open, onClose }) {
  // TODO: Replace DUMMY_PRESCRIPTIONS with API call:
  // const { data, loading } = useFetch(
  //   useCallback(
  //     () => visit ? getVisitPrescription(visit.visit_id) : Promise.resolve(null),
  //     [visit?.visit_id],
  //   ),
  //   [visit?.visit_id],
  // );
  // const prescriptions = data?.data || [];

  const prescriptions = DUMMY_PRESCRIPTIONS;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">

        {/* ── Dialog Header ─────────────────────────────────── */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Stethoscope className="size-5 text-primary" />
            Prescription Details
          </DialogTitle>
          {visit && (
            <DialogDescription asChild>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground pt-0.5">
                <Calendar className="size-3.5" />
                {new Date(visit.visit_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── Doctor & Patient Info Card ────────────────────── */}
        {visit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">

            {/* Doctor column */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Doctor
              </p>
              <InfoRow
                icon={Stethoscope}
                label="Name"
                value={visit.doctor_name}
              />
              <InfoRow
                icon={User}
                label="Specialization"
                value={visit.doctor_specialization}
              />
            </div>

            {/* Divider on mobile (horizontal), hidden on sm+ */}
            <Separator className="sm:hidden" />

            {/* Patient column */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Patient
              </p>
              <InfoRow
                icon={UserRound}
                label="Name"
                value={visit.patient_name}
              />
              <InfoRow
                icon={Hash}
                label="Card ID"
                value={visit.card_id}
              />
            </div>
          </div>
        )}

        {/* ── Visit Summary (Symptoms + Advice) ─────────────── */}
        {visit && (visit.symptoms || visit.advice) && (
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
            {visit.symptoms && (
              <div className="flex gap-2">
                <AlignLeft className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    Symptoms
                  </p>
                  <p className="text-sm">{visit.symptoms}</p>
                </div>
              </div>
            )}
            {visit.advice && (
              <div className="flex gap-2">
                <Stethoscope className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    Doctor's Advice
                  </p>
                  <p className="text-sm">{visit.advice}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Prescribed Medicines ──────────────────────────── */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Pill className="size-4 text-primary" />
            Prescribed Medicines
          </h3>

          <div className="grid gap-3">
            {prescriptions.map((med, idx) => (
              <div
                key={med.prescription_id ?? idx}
                className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
              >
                {/* Medicine name */}
                <div className="mb-3">
                  <p className="font-semibold text-sm leading-tight">
                    {med.medicine_name}
                  </p>
                  {med.generic_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {med.generic_name}
                    </p>
                  )}
                </div>

                {/* Stat chips */}
                <div className="grid grid-cols-3 gap-2">
                  {/* <StatChip
                    icon={<Hash className="size-3" />}
                    label="Quantity"
                    value={
                      med.quantity != null
                        ? `${med.quantity} ${med.unit ?? "pcs"}`
                        : "—"
                    }
                  /> */}
                  <StatChip
                    icon={<Pill className="size-3" />}
                    label="Dose"
                    value={med.dose ?? "—"}
                  />
                  <StatChip
                    icon={<Clock className="size-3" />}
                    label="Frequency"
                    value={med.frequency ?? "—"}
                  />
                  <StatChip
                    icon={<Utensils className="size-3" />}
                    label="Timing"
                    value={med.timing ?? "After meals"}
                  />
                </div>

                {/* Duration */}
                {med.duration && (
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Duration:
                    </span>{" "}
                    {med.duration}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
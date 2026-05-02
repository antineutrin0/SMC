// pages/doctor/StudentVerificationPage.jsx
// (or components/doctor/StudentVerificationPage.jsx — adjust to your routing)

import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { SectionHeader } from "../../components/shared";
import { PatientProfile } from "../../components/patient/PatientProfile";
import { PatientVisitHistory } from "../../components/patient/PatientVisitHistory";
import { NumericInput } from "../../components/shared/NumericInput";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useForm, useDisclosure } from "../../hooks";
import { createPrescription, getMedicines } from "../../services/api";

// ── Constants ─────────────────────────────────────────────────
const EMPTY_MED = {
  medicineId:   "",
  dosageAmount: "",
  dosageUnit:   "mg",
  durationDay:  1,
  frequency:    1,
};

// ── MedicationRow (local — same as DoctorVisits) ──────────────
// function MedicationRow({ med, index, medicines, onChange, onRemove }) {
//   return (
//     <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//         <div className="space-y-1">
//           <Label className="text-xs">Medicine</Label>
//           <Select
//             value={med.medicineId}
//             onValueChange={(v) => onChange(index, "medicineId", v)}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="Select medicine" />
//             </SelectTrigger>
//             <SelectContent>
//               {medicines.map((m) => (
//                 <SelectItem key={m.medicine_id} value={String(m.medicine_id)}>
//                   {m.name} ({m.total_quantity ?? 0} left)
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//         <div className="grid grid-cols-2 gap-2">
//           <div className="space-y-1">
//             <Label className="text-xs">Dosage</Label>
//             <Input
//               type="number"
//               placeholder="500"
//               min={0}
//               value={med.dosageAmount}
//               onChange={(e) => {
//                 const val = e.target.value;
//                 if (val === "" || Number(val) >= 0)
//                   onChange(index, "dosageAmount", val);
//               }}
//             />
//           </div>
//           <div className="space-y-1">
//             <Label className="text-xs">Unit</Label>
//             <Select
//               value={med.dosageUnit}
//               onValueChange={(v) => onChange(index, "dosageUnit", v)}
//             >
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="mg">mg</SelectItem>
//                 <SelectItem value="ml">ml</SelectItem>
//                 <SelectItem value="unit">unit</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//       </div>
//       <div className="grid grid-cols-3 gap-3 items-end">
//         <div className="space-y-1">
//           <Label className="text-xs">Duration (days)</Label>
//           <NumericInput
//             value={med.durationDay}
//             onChange={(val) => onChange(index, "durationDay", val)}
//             min={1}
//             max={365}
//             placeholder="7"
//           />
//         </div>
//         <div className="space-y-1">
//           <Label className="text-xs">Frequency/day</Label>
//           <NumericInput
//             value={med.frequency}
//             onChange={(val) => onChange(index, "frequency", val)}
//             min={1}
//             max={24}
//             placeholder="3"
//           />
//         </div>
//         <Button
//           type="button"
//           variant="destructive"
//           size="sm"
//           className="h-9"
//           onClick={() => onRemove(index)}
//         >
//           <Trash2 className="w-4 h-4" />
//         </Button>
//       </div>
//     </div>
//   );
// }

// ── Page ──────────────────────────────────────────────────────
export default function StudentVerificationPage() {
  const { user } = useAuth();
  const prescModal = useDisclosure();
  const [medications, setMedications] = useState([]);

  // visitId must come from context (e.g. URL param or selected visit)
  // For now we track it from the "create visit" flow upstream
  const [activeVisitId, setActiveVisitId] = useState(null);

  const { values: rxForm, setValue: setRx, reset: resetRx } = useForm({
    symptoms: "",
    advice:   "",
  });

  const { data: medicineRes } = useFetch(getMedicines);
  const medicines = medicineRes?.data || [];

  const { mutate: submitRx, loading: rxLoading } = useMutation(
    createPrescription,
    {
      successMessage: "Prescription created",
      onSuccess: () => {
        prescModal.close();
        resetRx();
        setMedications([]);
      },
    },
  );

  const handleRxSubmit = (e) => {
    e.preventDefault();
    if (!activeVisitId) return;
    submitRx({
      visitId:     activeVisitId,
      symptoms:    rxForm.symptoms,
      advice:      rxForm.advice,
      medications: medications.map((m) => ({
        medicineId:   m.medicineId,
        dosageAmount: m.dosageAmount,
        dosageUnit:   m.dosageUnit,
        durationDay:  m.durationDay,
        frequency:    m.frequency,
      })),
    });
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
  };

  return (
    <div className="space-y-6">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Student Verification"
          subtitle="Review patient profile and consultation history"
          icon={ShieldCheck}
        />
        <Button
          onClick={prescModal.open}
          size="sm"
          className="shrink-0 mt-1"
          disabled={!activeVisitId}
          title={!activeVisitId ? "Select a visit first" : "Create prescription"}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Prescription
        </Button>
      </div>

      {/* ── Patient Profile ───────────────────────────────── */}
      <PatientProfile />

      {/* ── Visit History ─────────────────────────────────── */}
      <PatientVisitHistory />


    </div>
  );
}
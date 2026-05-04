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
  medicineId: "",
  dosageAmount: "",
  dosageUnit: "mg",
  durationDay: 1,
  frequency: 1,
};

export default function StudentVerificationPage() {
  const { user } = useAuth();
  const prescModal = useDisclosure();
  const [medications, setMedications] = useState([]);

  const [activeVisitId, setActiveVisitId] = useState(null);

  const {
    values: rxForm,
    setValue: setRx,
    reset: resetRx,
  } = useForm({
    symptoms: "",
    advice: "",
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
      visitId: activeVisitId,
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
          title={
            !activeVisitId ? "Select a visit first" : "Create prescription"
          }
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Prescription
        </Button>
      </div>

      <PatientProfile />

      <PatientVisitHistory />
    </div>
  );
}

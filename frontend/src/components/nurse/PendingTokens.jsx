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
import { Pill, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useDisclosure } from "../../hooks";
import {
  getPendingTokens,
  getPrescription,
  dispenseMedicine,
} from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";

export function PendingTokens() {
  const { user } = useAuth();
  const { isOpen, open, close } = useDisclosure();
  const [selectedToken, setSelectedToken] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [prescLoading, setPrescLoading] = useState(false);

  const { data, loading, refetch } = useFetch(getPendingTokens);
  const tokens = data?.data ?? [];

  const handleTokenClick = async (token) => {
    console.log(token.visit_id);
    setSelectedToken(token);
    setPrescLoading(true);
    try {
      const presc = await getPrescription(token.visit_id);
      setPrescription(presc.data);
      const init = {};
      presc.data.medications?.forEach((m) => {
        init[m.medicine_id] = m.dosage_amount * m.duration_day * m.frequency;
      });
      setQuantities(init);
      open();
    } finally {
      setPrescLoading(false);
    }
  };

  const { mutate: dispense, loading: dispensing } = useMutation(
    dispenseMedicine,
    {
      successMessage: "Medicine dispensed successfully",
      onSuccess: () => {
        close();
        setSelectedToken(null);
        setPrescription(null);
        setQuantities({});
        refetch();
      },
    },
  );

  const handleDispense = () => {
    if (!selectedToken || !prescription) return;
    dispense({
      tokenId: selectedToken.token_id,
      medicines: prescription.medications.map((m) => ({
        medicineId: m.medicine_id,
        quantity: quantities[m.medicine_id] || 0,
      })),
      employeeId: user.id,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Prescription Tokens</CardTitle>
          <CardDescription>
            Patients waiting for medicine collection
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
                    <TableHead>Token</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Card ID
                    </TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Symptoms
                    </TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((t) => (
                    <TableRow key={t.token_id}>
                      <TableCell>
                        <Badge>#{t.token_id}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {t.patient_name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">
                        {t.card_id}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(t.issued_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {t.symptoms || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleTokenClick(t)}
                          disabled={prescLoading}
                        >
                          <Pill className="w-3.5 h-3.5 mr-1.5" />
                          Dispense
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tokens.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          icon={Pill}
                          title="No pending tokens"
                          description="All medicines have been dispensed"
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

      {/* Dispense Dialog */}
      <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispense Medicine</DialogTitle>
            <DialogDescription>
              Token #{selectedToken?.token_id} — {selectedToken?.patient_name}
            </DialogDescription>
          </DialogHeader>

          {prescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    SYMPTOMS
                  </p>
                  <p>{prescription.symptoms}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    ADVICE
                  </p>
                  <p>{prescription.advice || "—"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Prescribed Medications</Label>
                {prescription.medications?.map((med) => (
                  <div
                    key={med.medicine_id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">
                          {med.medicine_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {med.generic_name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {med.available_quantity} available
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {med.dosage_amount}
                      {med.dosage_unit} × {med.frequency}/day ×{" "}
                      {med.duration_day} days
                    </p>
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity to Dispense</Label>
                      <Input
                        type="number"
                        value={quantities[med.medicine_id] || 0}
                        onChange={(e) =>
                          setQuantities((q) => ({
                            ...q,
                            [med.medicine_id]: parseInt(e.target.value) || 0,
                          }))
                        }
                        max={med.available_quantity}
                        min={0}
                        className="h-8 w-32"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button onClick={handleDispense} disabled={dispensing}>
                  <Pill className="w-4 h-4 mr-1.5" />
                  {dispensing ? "Dispensing…" : "Confirm Dispense"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

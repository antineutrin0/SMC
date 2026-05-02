import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Pill } from "lucide-react";

export function DispenseDialog({
  isOpen,
  onClose,
  selectedToken,
  prescription,
  quantities,
  dispensing,
  onConfirm,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
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
                      <p className="font-medium text-sm">{med.medicine_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {med.generic_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {med.available_quantity} available
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center bg-muted/50 p-2 rounded">
                    <span className="text-xs text-muted-foreground italic">
                      {med.dosage_amount} {med.dosage_unit} × {med.frequency}
                      /day × {med.duration_day} days
                    </span>
                    <div className="text-sm font-semibold">
                      Qty: {quantities[med.medicine_id]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onConfirm} disabled={dispensing}>
                <Pill className="w-4 h-4 mr-1.5" />
                {dispensing ? "Dispensing…" : "Confirm Dispense"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

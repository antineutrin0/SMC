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
            Token #{selectedToken?.token_uuid} — {selectedToken?.patient_name}
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
                  DOCTOR
                </p>
                <p>{selectedToken?.doctor_name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  ADVICE
                </p>
                <p>{prescription.advice || "—"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Items to Dispense</Label>
              {selectedToken?.items?.map((item) => (
                <div
                  key={item.medicine_id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {item.medicine_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end items-center bg-muted/50 p-2 rounded">
                    <div className="text-sm font-semibold">
                      Dispensing Quantity: {item.quantity}
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Pill } from "lucide-react";

export function FirstAidDispenseDialog({
  isOpen,
  onClose,
  request,
  dispensing,
  onConfirm,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dispense First Aid</DialogTitle>
          <DialogDescription>
            Request #{request?.request_id} — {request?.fullname}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          {/* ⚠️ NOTE */}
          <p className="text-sm text-muted-foreground">
            This will dispense all items associated with this request.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button onClick={onConfirm} disabled={dispensing}>
              <Pill className="w-4 h-4 mr-1.5" />
              {dispensing ? "Dispensing…" : "Confirm Dispense"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
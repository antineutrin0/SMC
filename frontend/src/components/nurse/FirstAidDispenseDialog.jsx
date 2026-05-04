import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dispense First Aid</DialogTitle>
          <DialogDescription>
            Request #{request?.request_id} — {request?.fullname}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/40 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">{request?.statue}</Badge>
            </div>

            {request?.request_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested On</span>
                <span>
                  {new Date(request.request_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {request?.trip_details && (
              <div>
                <p className="text-muted-foreground mb-1">Trip Details</p>
                <p className="text-sm">{request.trip_details}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Items to Dispense</p>

            {request?.items?.length > 0 ? (
              request.items.map((item) => (
                <div
                  key={item.medicine_id}
                  className="border rounded-lg p-3 space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">{item.name}</p>
                    <span className="text-sm font-semibold">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No items found.</p>
            )}
          </div>

          {/*  Note */}
          <p className="text-xs text-muted-foreground">
            This action will deduct items from substore inventory.
          </p>

          {/* ── Actions ───────────────────── */}
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
      </DialogContent>
    </Dialog>
  );
}

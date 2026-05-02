import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Plus, Minus } from "lucide-react";
import ImageUpload from "../shared/ImageUpload";

export default function RequestDialog({
  isOpen,
  close,
  medicines,
  onSubmit,
  submitting,
  user,
}) {
  const [tripDetails, setTripDetails] = useState("");
  const [selected, setSelected] = useState([]);
  const [documentUrl, setDocumentUrl] = useState("");
  const toggleMedicine = (med) => {
    setSelected((prev) => {
      const exists = prev.find((m) => m.id === med.medicine_id);
      if (exists) return prev.filter((m) => m.id !== med.medicine_id);
      return [
        ...prev,
        { id: med.medicine_id, name: med.name, quantity: 10 },
      ];
    });
  };

  const updateQty = (id, qty) => {
    setSelected((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, quantity: Math.max(1, parseInt(qty) || 1) }
          : m
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      requestedBy: user.id,
      tripDetails,
      documentUrl: documentUrl,
      items: selected.map((m) => ({
        medicineId: m.id,
        quantity: m.quantity,
      })),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request First Aid Kit</DialogTitle>
          <DialogDescription>
            Provide study tour details and select required medicines
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trip Details */}
          <div className="space-y-1.5">
            <Label>Trip Details</Label>
            <Textarea
              rows={3}
              placeholder="e.g. 3-day tour to Cox's Bazar, 50 students"
              value={tripDetails}
              onChange={(e) => setTripDetails(e.target.value)}
              required
            />
            <Label >Document Upload</Label>
            <ImageUpload onUpload={(url) => setDocumentUrl(url)}/>
          </div>

          {/* Medicines */}
          <div className="space-y-1.5">
            <Label>Select Medicines</Label>

            <div className="border rounded-lg divide-y max-h-44 overflow-y-auto">
              {medicines.map((med) => {
                const isSelected = selected.some(
                  (m) => m.id === med.medicine_id
                );

                return (
                  <div
                    key={med.medicine_id}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                    onClick={() => toggleMedicine(med)}
                  >
                    <span className="text-sm">{med.name}</span>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {med.total_quantity ?? 0}
                      </Badge>

                      {isSelected && (
                        <Badge className="text-xs">✓</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quantities */}
          {selected.length > 0 && (
            <div className="space-y-2">
              <Label>Quantities</Label>

              {selected.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm truncate">
                    {m.name}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQty(m.id, m.quantity - 1)}
                      className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <Input
                      type="number"
                      value={m.quantity}
                      onChange={(e) =>
                        updateQty(m.id, e.target.value)
                      }
                      className="w-16 h-7 text-center text-sm"
                      min={1}
                    />

                    <button
                      type="button"
                      onClick={() => updateQty(m.id, m.quantity + 1)}
                      className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting || !tripDetails}
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
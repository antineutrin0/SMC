import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { NumericInput, LoadingSpinner } from "../shared";
import { getPrescription, createToken } from "../../services/api";
import { Trash2 } from "lucide-react";

export function TokenDialog({ visit, open, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [meds, setMeds] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !visit) return;
    let mounted = true;
    setLoading(true);
    getPrescription(visit.visit_id)
      .then((res) => {
        if (!mounted) return;
        console.log("Prescription data:", res);
         const data = res?.data || res;
        const medications = data?.medications || data?.meds || [];
         const normalized = medications.map((m) => ({
          medicine_id: m.medicine_id ?? m.medicineId ?? m.id,
          name: m.name ?? m.medicine_name ?? "",
          available: m.total_quantity ?? m.available ?? 0,
          quantity: m.quantity ?? m.qty ?? 1,
        }));
        setMeds(normalized);
      })
      .catch((err) => {
        console.error(err);
        setMeds([]);
      })
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, [open, visit]);

  const updateQty = (idx, val) => {
    setMeds((p) => p.map((m, i) => (i === idx ? { ...m, quantity: val } : m)));
  };

  const removeMed = (idx) => {
    setMeds((p) => p.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        visitId: visit.visit_id,
        medications: meds.map((m) => ({ medicineId: m.medicine_id, quantity: m.quantity })),
      };
      await createToken(payload);
      onCreated && onCreated(visit.visit_id);
      onClose && onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose && onClose()}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Token</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {meds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No medicines to include</p>
            ) : (
              meds.map((m, i) => (
                <div key={m.medicine_id} className="flex items-center justify-between gap-3 border p-3 rounded">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">Available: {m.available}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <NumericInput
                      value={m.quantity}
                      onChange={(val) => updateQty(i, val)}
                      min={1}
                      max={m.available || 9999}
                    />
                    {(m.available ?? 0) <= 0 && (
                      <Button type="button" variant="destructive" onClick={() => removeMed(i)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreate} disabled={creating || meds.length === 0}>
                {creating ? "Creating…" : "Create Token"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TokenDialog;

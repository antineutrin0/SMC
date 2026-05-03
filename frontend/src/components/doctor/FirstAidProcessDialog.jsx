import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { getMedicines, processFirstAidRequest } from "../../services/api";

const EMPTY_ITEM = { medicine_id: "", quantity: "", _name: "" };

// ── Inline medicine search row ────────────────────────────────
function MedicineSearchRow({ item, index, medicines, onChange, onRemove, canRemove }) {
  const [query, setQuery] = useState(item._name || "");
  const [showList, setShowList] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowList(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = query
    ? medicines.filter((m) =>
        m.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (m) => {
    onChange(index, { medicine_id: String(m.medicine_id), _name: m.name });
    setQuery(m.name);
    setShowList(false);
  };

  return (
    <div className="flex gap-2 items-end">
      {/* Medicine search */}
      <div className="flex-1 space-y-1 relative" ref={wrapperRef}>
        {index === 0 && <Label className="text-xs">Medicine</Label>}
        <Input
          placeholder="Type medicine name…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(index, { medicine_id: "", _name: e.target.value });
            setShowList(true);
          }}
          onFocus={() => setShowList(true)}
        />
        {showList && (
          <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
            {filtered.length > 0 ? (
              filtered.map((m) => (
                <div
                  key={m.medicine_id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onMouseDown={() => handleSelect(m)}
                >
                  {m.name}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({m.generic_name})
                  </span>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No matching medicine
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="w-24 space-y-1">
        {index === 0 && <Label className="text-xs">Quantity</Label>}
        <Input
          type="number"
          min={1}
          placeholder="Qty"
          value={item.quantity}
          onChange={(e) => onChange(index, { quantity: e.target.value })}
        />
      </div>

      {/* Remove */}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={!canRemove}
        onClick={() => onRemove(index)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── Main dialog ───────────────────────────────────────────────
export function FirstAidProcessDialog({ request, open, onClose, onProcessed }) {
  const [medicines, setMedicines] = useState([]);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMedicines()
      .then((res) => setMedicines(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (open) {
      setItems([{ ...EMPTY_ITEM }]);
      setError("");
    }
  }, [open, request?.request_id]);

  const addRow = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);

  const removeRow = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateRow = (idx, patch) =>
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );

  const handleSubmit = async () => {
    setError("");

    const payload = items
      .filter((i) => i.medicine_id && Number(i.quantity) > 0)
      .map((i) => ({
        medicine_id: Number(i.medicine_id),
        quantity: Number(i.quantity),
      }));

    if (payload.length === 0) {
      setError("Add at least one medicine with a valid quantity.");
      return;
    }

    try {
      setSubmitting(true);
      await processFirstAidRequest(request.request_id, payload);
      onProcessed(request.request_id);
    } catch (err) {
      setError(err?.message || "Failed to process request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Process First Aid Request</DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs">{request.request_id}</span>
            {" · "}
            {request.fullname}
          </DialogDescription>
        </DialogHeader>

        {/* Request detail */}
        <div className="space-y-2 text-sm border rounded-lg p-3 bg-muted/40">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{new Date(request.request_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className="border-emerald-500 text-emerald-700">
              {request.statue}
            </Badge>
          </div>
          {request.trip_details && (
            <div className="pt-1 border-t">
              <p className="text-muted-foreground mb-1">Trip details</p>
              <p>{request.trip_details}</p>
            </div>
          )}
        </div>

        {/* Medicine rows */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Medicines to allocate</p>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <MedicineSearchRow
                key={idx}
                index={idx}
                item={item}
                medicines={medicines}
                onChange={updateRow}
                onRemove={removeRow}
                canRemove={items.length > 1}
              />
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addRow}
            className="w-full mt-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add medicine
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? "Processing…" : "Confirm & Process"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FirstAidProcessDialog;
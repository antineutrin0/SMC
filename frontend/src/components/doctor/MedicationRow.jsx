import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getMedicines } from "../../services/api";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { NumericInput } from "../shared";
import AddMedicineDialog from "../shared/AddMedicineDialog";
import { addMedicine } from "../../services/api";

export function MedicationRow({ med, index, medicines, onChange, onRemove }) {
  const [query, setQuery] = useState("");
  const [showList, setShowList] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    genericName: "",
    category: "",
  });
  const [localMedicines, setLocalMedicines] = useState(medicines || []);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowList(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // derive selected medicine name
  const selectedMed = localMedicines.find(
    (m) => String(m.medicine_id) === String(m.med || med.medicineId),
  );
  const selectedName = selectedMed ? selectedMed.name : "";

  const filtered = query
    ? localMedicines.filter((m) =>
        m.name.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const handleSelect = (m) => {
    onChange(index, "medicineId", String(m.medicine_id));
    setQuery(m.name);
    setShowList(false);
  };

  const handleAddClick = (name) => {
    setAddForm((f) => ({ ...f, name }));
    setAddOpen(true);
  };

  const handleAddSubmit = async (form) => {
    try {
      setAddLoading(true);

      const res = await addMedicine(form);

      // reload medicines AFTER success
      const medsRes = await getMedicines();
      const updated = medsRes?.data || [];
      setLocalMedicines(updated);

      // select the newly added medicine
      const newMed =
        updated.find((m) => m.name === form.name) ||
        updated.find((m) => m.medicine_id === res?.data?.medicine_id);

      if (newMed) {
        onChange(index, "medicineId", String(newMed.medicine_id));
        setQuery(newMed.name);
      }

      setAddOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
      {/* Row 1: Medicine search + Dosage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" ref={wrapperRef}>
        <div className="space-y-1 relative">
          <Label className="text-xs">Medicine</Label>
          <Input
            placeholder="Type medicine name"
            value={query || selectedName}
            onChange={(e) => {
              setQuery(e.target.value);
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
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelect(m)}
                  >
                    {m.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({m.total_quantity ?? 0} left)
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    No matching medicine
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddClick(query)}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Dosage</Label>
            <Input
              type="number"
              placeholder="500"
              min={0}
              value={med.dosageAmount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0) {
                  onChange(index, "dosageAmount", val);
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Unit</Label>
            <Select
              value={med.dosageUnit}
              onValueChange={(val) => onChange(index, "dosageUnit", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mg">mg</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="unit">unit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Row 2: Duration + Frequency + Remove */}
      <div className="grid grid-cols-3 gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Duration (days)</Label>
          <NumericInput
            value={med.durationDay}
            onChange={(val) => onChange(index, "durationDay", val)}
            min={1}
            max={365}
            placeholder="7"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Frequency/day</Label>
          <NumericInput
            value={med.frequency}
            onChange={(val) => onChange(index, "frequency", val)}
            min={1}
            max={24}
            placeholder="3"
          />
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-9"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <AddMedicineDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        medForm={addForm}
        setMed={(k, v) => setAddForm((f) => ({ ...f, [k]: v }))}
        onSubmit={handleAddSubmit}
        loading={addLoading}
      />
    </div>
  );
}

export default MedicationRow;

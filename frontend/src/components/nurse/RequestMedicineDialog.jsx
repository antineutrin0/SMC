import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Trash2, PlusCircle, Package } from "lucide-react";

export function RequestMedicineDialog({
  isOpen,
  onClose,
  medicines,
  onSubmit,
  loading,
  nurseId,
}) {
  const [selectedItems, setSelectedItems] = useState([
    { medicineId: "", quantity: 1 },
  ]);
  const [note, setNote] = useState("");

  const addItem = () => {
    setSelectedItems([...selectedItems, { medicineId: "", quantity: 1 }]);
  };

  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...selectedItems];
    newItems[index][field] = value;
    setSelectedItems(newItems);
  };

  const handleConfirm = () => {
    const validItems = selectedItems.filter(
      (item) => item.medicineId && item.quantity > 0,
    );
    if (validItems.length === 0) return;

    onSubmit({
      nurseId,
      items: validItems,
      reason: note,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Medicine Stock</DialogTitle>
          <DialogDescription>
            Select items from the inventory to request for your station.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4 max-h-[50vh] overflow-y-auto pr-2">
          {selectedItems.map((item, index) => (
            <div
              key={index}
              className="flex gap-3 items-end border-b pb-4 last:border-0"
            >
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Medicine</Label>
                <Select
                  value={item.medicineId}
                  onValueChange={(val) => updateItem(index, "medicineId", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medicine" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicines.map((m) => (
                      <SelectItem
                        key={m.medicine_id}
                        value={String(m.medicine_id)}
                      >
                        {m.name}{" "}
                        <span className="text-muted-foreground text-[10px]">
                          ({m.total_quantity} in stock)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-24 space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", parseInt(e.target.value) || 0)
                  }
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => removeItem(index)}
                disabled={selectedItems.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={addItem}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Another Item
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Request Note (Optional)</Label>
          <Input
            placeholder="e.g. Monthly replenishment"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || selectedItems.every((i) => !i.medicineId)}
          >
            <Package className="w-4 h-4 mr-2" />
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

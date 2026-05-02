import React from "react";
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

export function AddMedicineDialog({ open, onClose, medForm, setMed, onSubmit, loading }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add New Medicine</DialogTitle>
          <DialogDescription>Register a new medicine in the system</DialogDescription>
        </DialogHeader>
                <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();   
            onSubmit(medForm);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Medicine Name</Label>
            <Input
              placeholder="e.g. Paracetamol"
              value={medForm.name}
              onChange={(e) => setMed("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Generic Name</Label>
            <Input
              placeholder="e.g. Acetaminophen"
              value={medForm.genericName}
              onChange={(e) => setMed("genericName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input
              placeholder="e.g. Painkiller"
              value={medForm.category}
              onChange={(e) => setMed("category", e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding…" : "Add Medicine"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddMedicineDialog;

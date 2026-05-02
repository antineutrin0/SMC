import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Plus, Package } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useForm, useDisclosure } from "../../hooks";
import {
  getPharmacistMedicines,
  addMedicine,
  addInventory,
} from "../../services/api";
import { LoadingSpinner } from "../shared";
import InventoryTable from "./InventoryTable";
import AddMedicineDialog from "../shared/AddMedicineDialog";

function stockVariant(qty) {
  if (qty > 100) return "default";
  if (qty > 20) return "secondary";
  return "destructive";
}
function stockLabel(qty) {
  if (qty > 100) return "Good Stock";
  if (qty > 20) return "Low Stock";
  return "Critical";
}

export function MedicineInventory() {
  const { user } = useAuth();
  const addModal = useDisclosure();
  const stockModal = useDisclosure();

  const { data, loading, refetch } = useFetch(getPharmacistMedicines);
  const medicines = data?.data ?? [];

  const {
    values: medForm,
    setValue: setMed,
    reset: resetMed,
  } = useForm({ name: "", genericName: "", category: "" });
  const {
    values: invForm,
    setValue: setInv,
    reset: resetInv,
  } = useForm({ medicineId: "", quantity: "", expDate: "" });

  const { mutate: submitMedicine, loading: addingMed } = useMutation(
    addMedicine,
    {
      successMessage: "Medicine added",
      onSuccess: () => {
        addModal.close();
        resetMed();
        refetch();
      },
    },
  );

  const { mutate: submitInventory, loading: addingInv } = useMutation(
    (data) => addInventory({ ...data, employeeId: user?.id }),
    {
      successMessage: "Stock updated",
      onSuccess: () => {
        stockModal.close();
        resetInv();
        refetch();
      },
    },
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Medicine Inventory</CardTitle>
            <CardDescription>Manage stock levels</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={addModal.open}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Medicine
            </Button>
            <Button size="sm" variant="outline" onClick={stockModal.open}>
              <Package className="w-4 h-4 mr-1.5" />
              Add Stock
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <InventoryTable medicines={medicines} loading={loading} />
      </CardContent>

      <AddMedicineDialog
        open={addModal.isOpen}
        onClose={addModal.close}
        medForm={medForm}
        setMed={setMed}
        onSubmit={submitMedicine}
        loading={addingMed}
      />

      {/* Add Stock Dialog */}
      <Dialog
        open={stockModal.isOpen}
        onOpenChange={(v) => !v && stockModal.close()}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Inventory Stock</DialogTitle>
            <DialogDescription>
              Add stock for an existing medicine
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitInventory(invForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Medicine</Label>
              <Select
                value={invForm.medicineId}
                onValueChange={(v) => setInv("medicineId", v)}
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
                      {m.name} ({m.generic_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 500"
                value={invForm.quantity}
                onChange={(e) => setInv("quantity", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={invForm.expDate}
                onChange={(e) => setInv("expDate", e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={stockModal.close}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addingInv}>
                {addingInv ? "Adding…" : "Add Stock"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

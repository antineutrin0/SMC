import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
import { useMutation, useForm } from "../../hooks";
import { createEmployee } from "../../services/api";
import ImageUpload from "../shared/ImageUpload";

const INITIAL_FORM = {
  fullname: "",
  designation: "",
  specialization: "",
  license_no: "",
  contact_no: "",
  email: "",
  password: "",
  photo_url: "",
};

export function CreateEmployeeDialog({ isOpen, onClose, onSuccess }) {
  const { values: form, setValue, reset } = useForm(INITIAL_FORM);

  const { mutate: submit, loading } = useMutation(createEmployee, {
    successMessage: "Employee created successfully",
    onSuccess: () => {
      onSuccess?.();
      onClose();
      reset();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter details to register a new staff member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              value={form.fullname}
              onChange={(e) => setValue("fullname", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Select
                value={form.designation}
                onValueChange={(v) => setValue("designation", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doctor">Doctor</SelectItem>
                  <SelectItem value="Nurse">Nurse</SelectItem>
                  <SelectItem value="Registrar">Registrar</SelectItem>
                  <SelectItem value="Driver">Driver</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contact Number</Label>
              <Input
                value={form.contact_no}
                onChange={(e) => setValue("contact_no", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setValue("email", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Specialization</Label>
              <Input
                value={form.specialization}
                onChange={(e) => setValue("specialization", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>License No</Label>
              <Input
                value={form.license_no}
                onChange={(e) => setValue("license_no", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setValue("password", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Document Upload</Label>
            <ImageUpload onUpload={(url) => setValue("photo_url", url)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  User,
  Phone,
  Stethoscope,
  Hash,
  Pencil,
  KeyRound,
  PowerOff,
  Power,
  X,
  Check,
  Activity,
} from "lucide-react";
import { useFetch, useMutation, useForm } from "../../hooks";
import {
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  resetEmployeePassword,
} from "../../services/api";
import { LoadingSpinner } from "../shared";
import ImageUpload from "../shared/ImageUpload";

function InfoRow({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function EmployeeDetailDialog({ employeeId, open, onClose, onSuccess }) {
  const [mode, setMode] = useState("view"); // "view" | "edit" | "password"
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");

  const { data, loading, refetch } = useFetch(
    useCallback(() => {
      if (!employeeId) return Promise.resolve(null);
      return getEmployeeById(employeeId);
    }, [employeeId]),
  );

  const emp = data?.data ?? null;

  const {
    values: form,
    setValue,
    setValues,
  } = useForm({
    fullname: "",
    designation: "",
    specialization: "",
    license_no: "",
    contact_no: "",
    photo_url: "",
  });

  // Sync form when employee data loads or edit mode opens
  const openEdit = () => {
    if (!emp) return;
    setValues({
      fullname: emp.fullname ?? "",
      designation: emp.designation ?? "",
      specialization: emp.specialization ?? "",
      license_no: emp.license_no ?? "",
      contact_no: emp.contact_no ?? "",
      photo_url: emp.photo_url ?? "",
    });
    setMode("edit");
  };

  const { mutate: submitEdit, loading: editLoading } = useMutation(
    (data) => updateEmployee(employeeId, data),
    {
      successMessage: "Employee updated",
      onSuccess: () => {
        refetch();
        onSuccess?.();
        setMode("view");
      },
    },
  );

  const { mutate: toggleStatus, loading: statusLoading } = useMutation(
    () => updateEmployeeStatus(employeeId, emp?.is_active ? 0 : 1),
    {
      successMessage: "Status updated",
      onSuccess: () => {
        refetch();
        onSuccess?.();
      },
    },
  );

  const { mutate: submitPassword, loading: pwLoading } = useMutation(
    () => resetEmployeePassword(employeeId, newPassword),
    {
      successMessage: "Password reset successfully",
      onSuccess: () => {
        setNewPassword("");
        setMode("view");
      },
    },
  );

  const handlePasswordSubmit = () => {
    setPwError("");
    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    submitPassword();
  };

  const handleClose = () => {
    setMode("view");
    setNewPassword("");
    setPwError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Employee"
              : mode === "password"
                ? "Reset Password"
                : "Employee Details"}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {employeeId}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner className="py-10" />
        ) : emp ? (
          <>
            {/* ── VIEW mode ── */}
            {mode === "view" && (
              <div className="space-y-4">
                {/* Photo + name header */}
                <div className="flex items-center gap-4">
                  {emp.photo_url ? (
                    <img
                      src={emp.photo_url}
                      alt={emp.fullname}
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold shrink-0">
                      {emp.fullname?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-base">{emp.fullname}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{emp.designation}</Badge>
                      <Badge variant={emp.is_active ? "default" : "secondary"}>
                        {emp.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2.5">
                  <InfoRow
                    icon={Hash}
                    label="Employee ID"
                    value={emp.employee_id}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Contact"
                    value={emp.contact_no}
                  />
                  <InfoRow
                    icon={Stethoscope}
                    label="Specialization"
                    value={emp.specialization}
                  />
                  <InfoRow
                    icon={Hash}
                    label="License No"
                    value={emp.license_no}
                  />
                </div>

                {/* Activity stats */}
                {emp.activity?.length > 0 && (
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Activity className="size-3.5" />
                      Activity
                    </p>
                    <div className="flex gap-4">
                      {emp.activity.map((a, i) => (
                        <div key={i} className="text-center">
                          <p className="text-2xl font-bold">{a.count}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openEdit}
                    className="flex-1"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMode("password")}
                    className="flex-1"
                  >
                    <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                    Reset Password
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={statusLoading}
                    onClick={toggleStatus}
                    className={`flex-1 ${
                      emp.is_active
                        ? "border-red-300 text-red-600 hover:bg-red-50"
                        : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    {emp.is_active ? (
                      <>
                        <PowerOff className="w-3.5 h-3.5 mr-1.5" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="w-3.5 h-3.5 mr-1.5" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── EDIT mode ── */}
            {mode === "edit" && (
              <div className="space-y-3">
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
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Specialization</Label>
                    <Input
                      value={form.specialization}
                      onChange={(e) =>
                        setValue("specialization", e.target.value)
                      }
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
                  <Label>Photo</Label>
                  <ImageUpload
                    onUpload={(url) => setValue("photo_url", url)}
                    existingUrl={form.photo_url}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMode("view")}
                    disabled={editLoading}
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={editLoading}
                    onClick={() => submitEdit(form)}
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    {editLoading ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── PASSWORD mode ── */}
            {mode === "password" && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Resetting password for{" "}
                  <span className="font-semibold text-foreground">
                    {emp.fullname}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  {pwError && <p className="text-xs text-red-600">{pwError}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMode("view")}
                    disabled={pwLoading}
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={pwLoading}
                    onClick={handlePasswordSubmit}
                  >
                    <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                    {pwLoading ? "Resetting…" : "Reset Password"}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Could not load employee details.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeDetailDialog;

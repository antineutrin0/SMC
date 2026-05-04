import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Pencil, KeyRound, X, Check,
  Phone, Stethoscope, Hash, Activity,
} from "lucide-react";
import { useFetch, useMutation, useForm } from "../../hooks";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../../services/api";
import { LoadingSpinner } from "./index";
import ImageUpload from "./ImageUpload";

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

export function EmployeeProfileDialog({ open, onClose }) {
  const [mode, setMode] = useState("view"); // "view" | "edit" | "password"
  const [pwError, setPwError] = useState("");

  const { data, loading, refetch } = useFetch(
    useCallback(() => (open ? getMyProfile() : Promise.resolve(null)), [open]),
  );
  const emp = data?.data ?? null;

  // ── Edit form ──
  const { values: form, setValue, setValues } = useForm({
    fullname: "", contact_no: "", specialization: "", license_no: "", photo_url: "",
  });

  const openEdit = () => {
    if (!emp) return;
    setValues({
      fullname:       emp.fullname       ?? "",
      contact_no:     emp.contact_no     ?? "",
      specialization: emp.specialization ?? "",
      license_no:     emp.license_no     ?? "",
      photo_url:      emp.photo_url      ?? "",
    });
    setMode("edit");
  };

  const { mutate: submitEdit, loading: editLoading } = useMutation(
    updateMyProfile,
    {
      successMessage: "Profile updated",
      onSuccess: () => { refetch(); setMode("view"); },
    },
  );

  // ── Password form ──
  const { values: pw, setValue: setPw } = useForm({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  const { mutate: submitPassword, loading: pwLoading } = useMutation(
    changeMyPassword,
    {
      successMessage: "Password changed successfully",
      onSuccess: () => { setMode("view"); },
    },
  );

  const handlePasswordSubmit = () => {
    setPwError("");
    if (!pw.currentPassword) return setPwError("Enter your current password.");
    if (pw.newPassword.length < 6) return setPwError("New password must be at least 6 characters.");
    if (pw.newPassword !== pw.confirmPassword) return setPwError("Passwords do not match.");
    submitPassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
  };

  const handleClose = () => {
    setMode("view");
    setPwError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Profile" : mode === "password" ? "Change Password" : "My Profile"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner className="py-10" />
        ) : emp ? (
          <>
            {/* ── VIEW ── */}
            {mode === "view" && (
              <div className="space-y-4">
                {/* Photo + name */}
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

                {/* Info */}
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2.5">
                  <InfoRow icon={Hash}        label="Employee ID"    value={emp.employee_id} />
                  <InfoRow icon={Phone}       label="Contact"        value={emp.contact_no} />
                  <InfoRow icon={Stethoscope} label="Specialization" value={emp.specialization} />
                  <InfoRow icon={Hash}        label="License No"     value={emp.license_no} />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={openEdit}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit Profile
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setMode("password")}>
                    <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                    Change Password
                  </Button>
                </div>
              </div>
            )}

            {/* ── EDIT ── */}
            {mode === "edit" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input value={form.fullname} onChange={(e) => setValue("fullname", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Contact Number</Label>
                    <Input value={form.contact_no} onChange={(e) => setValue("contact_no", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>License No</Label>
                    <Input value={form.license_no} onChange={(e) => setValue("license_no", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Specialization</Label>
                  <Input value={form.specialization} onChange={(e) => setValue("specialization", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Photo</Label>
                  <ImageUpload onUpload={(url) => setValue("photo_url", url)} existingUrl={form.photo_url} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setMode("view")} disabled={editLoading}>
                    <X className="w-3.5 h-3.5 mr-1.5" />Cancel
                  </Button>
                  <Button className="flex-1" disabled={editLoading} onClick={() => submitEdit(form)}>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    {editLoading ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── PASSWORD ── */}
            {mode === "password" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={pw.currentPassword}
                    onChange={(e) => setPw("currentPassword", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={pw.newPassword}
                    onChange={(e) => setPw("newPassword", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={pw.confirmPassword}
                    onChange={(e) => setPw("confirmPassword", e.target.value)}
                  />
                </div>
                {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setMode("view")} disabled={pwLoading}>
                    <X className="w-3.5 h-3.5 mr-1.5" />Cancel
                  </Button>
                  <Button className="flex-1" disabled={pwLoading} onClick={handlePasswordSubmit}>
                    <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                    {pwLoading ? "Saving…" : "Change Password"}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Could not load profile.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeProfileDialog;
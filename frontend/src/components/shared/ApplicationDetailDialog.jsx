import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  FileText,
  Hash,
  Calendar,
  User,
  Droplets,
  Image,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getStatusVariant } from "./index";

// ── Section wrapper ────────────────────────────────────────────
function Section({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="rounded-lg border bg-muted/30 p-3">{children}</div>
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 first:pt-0 last:pb-0 border-b last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

// ── Document image ────────────────────────────────────────────
function DocImage({ label, url }) {
  if (!url) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <img
        src={url}
        alt={label}
        className="w-full rounded-md border object-cover max-h-48"
        onError={(e) => {
          e.currentTarget.src =
            "https://placehold.co/600x200?text=Document+Not+Available";
        }}
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Image className="size-3" />
        Open full image
      </a>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────
// Props:
//   application  — the selected application object
//   open         — boolean
//   onClose      — () => void
//   onReview     — (id, status) => void  ← same handler from ApplicationReviews
export function ApplicationDetailDialog({
  application,
  open,
  onClose,
  onReview,
}) {
  if (!application) return null;

  const isPending = application.ApplicationStatus === "Pending";

  const handleAction = (status) => {
    onReview(application.ApplicationID, status);
    onClose(); // close dialog after action
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

        {/* ── Header ───────────────────────────────────────── */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="size-5 text-primary" />
            Application Details
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hash className="size-3.5" />
                #{application.ApplicationID}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-3.5" />
                {new Date(application.ApplicationDate).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
              <Badge variant={getStatusVariant(application.ApplicationStatus)}>
                {application.ApplicationStatus}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="space-y-4 pt-1">

          {/* Personal Info */}
          <Section icon={User} label="Personal Information">
            <InfoRow label="Full Name"     value={application.fullname} />
            <InfoRow label="Contact"       value={application.contact_number} />
            <InfoRow label="Email"         value={application.email} />
            <InfoRow label="Address"       value={application.address} />
            <InfoRow
              label="Date of Birth"
              value={
                application.DateOfBirth
                  ? new Date(application.DateOfBirth).toLocaleDateString()
                  : null
              }
            />
            <InfoRow label="Gender"        value={application.gender} />
            <InfoRow label="Card Type"     value={application.type} />
          </Section>

          {/* Medical Info */}
          <Section icon={Droplets} label="Medical Information">
            <InfoRow label="Blood Group" value={application.BloodGroup} />
            <InfoRow
              label="Height"
              value={
                application.Height_cm ? `${application.Height_cm} cm` : null
              }
            />
            <InfoRow
              label="Weight"
              value={
                application.Weight_kg ? `${application.Weight_kg} kg` : null
              }
            />
          </Section>

          {/* Documents */}
          <Section icon={Image} label="Documents">
            {application.PhotoUrl || application.IdCardUrl ? (
              <div className="space-y-4">
                <DocImage label="Photo"   url={application.PhotoUrl} />
                <DocImage label="ID Card" url={application.IdCardUrl} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No documents uploaded.
              </p>
            )}
          </Section>
        </div>

        {/* ── Footer: action buttons ────────────────────────── */}
        {isPending && (
          <DialogFooter className="flex-1 pt-2 gap-45 sm:gap-0">

            <Button
              variant="destructive"
              className="w-full sm:w-auto gap-1.5 mr-2"
              onClick={() => handleAction("Rejected")}
            >
              <XCircle className="size-4" />
              Reject
            </Button>
            <Button
              className="w-full sm:w-auto gap-1.5"
              onClick={() => handleAction("Approved")}
            >
              <CheckCircle className="size-4" />
              Approve
            </Button>
          </DialogFooter>
        )}

      </DialogContent>
    </Dialog>
  );
}
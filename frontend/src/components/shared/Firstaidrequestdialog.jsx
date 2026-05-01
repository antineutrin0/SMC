import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import {
  Backpack,
  Calendar,
  Hash,
  MapPin,
  Package,
  FileImage,
} from "lucide-react";
import { getStatusVariant } from "./index";

// Section wrapper
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

export function FirstAidRequestDialog({ request, open, onClose }) {
  if (!request) return null;

  const items = request?.items || [];
  const documentUrl = request?.document_url || null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Backpack className="size-5 text-primary" />
            First Aid Request Details
          </DialogTitle>

          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hash className="size-3.5" />
                Request #{request.request_id}
              </span>

              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-3.5" />
                {new Date(request.request_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>

              <Badge variant={getStatusVariant(request.statue)}>
                {request.statue}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-4 pt-1">

          {/* Trip Details */}
          <Section icon={MapPin} label="Trip Details">
            <p className="text-sm leading-relaxed">
              {request.trip_details || "No trip details provided."}
            </p>
          </Section>

          {/* Items */}
          <Section icon={Package} label={`Requested Items (${items.length})`}>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items found.</p>
            ) : (
              <div className="divide-y">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm">{item.medicine_name}</span>
                    <Badge variant="secondary" className="text-xs tabular-nums">
                      ×{item.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Document */}
          <Section icon={FileImage} label="Application Document">
            {documentUrl ? (
              <div className="space-y-2">
                <img
                  src={documentUrl}
                  alt="Application document"
                  className="w-full rounded-md border object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/600x200?text=Document+Not+Available";
                  }}
                />
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <FileImage className="size-3" />
                  Open full document
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No document uploaded.
              </p>
            )}
          </Section>

        </div>
      </DialogContent>
    </Dialog>
  );
}
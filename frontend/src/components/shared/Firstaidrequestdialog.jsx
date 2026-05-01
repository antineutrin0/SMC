import { useCallback } from "react";
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
import { getStatusVariant, LoadingSpinner } from "./index";
import { useFetch } from "../../hooks";


// ─────────────────────────────────────────────────────────────
// DUMMY DATA — comment this block back in if backend is not ready
// ─────────────────────────────────────────────────────────────
const DUMMY_DETAIL = {
  items: [
    { medicine_name: "Paracetamol",     quantity: 20 },
    { medicine_name: "ORS Saline",      quantity: 10 },
    { medicine_name: "Antacid",         quantity: 15 },
    { medicine_name: "Bandage Roll",    quantity: 5  },
    { medicine_name: "Antiseptic Wipe", quantity: 30 },
  ],
  document_url: "https://placehold.co/600x400?text=Application+Document",
};
// ─────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────
export function FirstAidRequestDialog({ request, open, onClose }) {
  // Fetch full detail (items + document_url) when dialog opens
//   const { data, loading } = useFetch(
//     useCallback(
//       () =>
//         request?.request_id
//           ? getFirstAidRequestDetail(request.request_id)
//           : Promise.resolve(null),
//       [request?.request_id],
//     ),
//     [request?.request_id],
//   );

  // Live data from API
//   const detail = data?.data;

  // ── Swap these two lines to toggle dummy ↔ real data ─────────
//   const items       = detail?.items        || [];
//   const documentUrl = detail?.document_url || null;
  const items       = DUMMY_DETAIL.items;           // ← dummy
  const documentUrl = DUMMY_DETAIL.document_url;    // ← dummy
  const loading = false;                            // ← dummy
  // ─────────────────────────────────────────────────────────────

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

        {/* ── Header ───────────────────────────────────────── */}
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

        {/* ── Body ─────────────────────────────────────────── */}
        {loading ? (      // loadding state while fetching detail
          <LoadingSpinner className="py-10" />
        ) : (
          <div className="space-y-4 pt-1">

            {/* ── Trip Details ────────────────────────────── */}
            <Section icon={MapPin} label="Trip Details">
              <p className="text-sm leading-relaxed">
                {request.trip_details || "No trip details provided."}
              </p>
            </Section>

            {/* ── Medicine Items ───────────────────────────── */}
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
                      <Badge
                        variant="secondary"
                        className="text-xs tabular-nums"
                      >
                        ×{item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* ── Application Document ─────────────────────── */}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
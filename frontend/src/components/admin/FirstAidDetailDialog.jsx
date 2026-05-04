import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Calendar,
  User,
  FileText,
  Pill,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useFetch } from "../../hooks";
import {
  getAdminFirstAidRequestById,
  adminApproveFirstAidRequest,
} from "../../services/api";
import { LoadingSpinner } from "../shared";

const STATUS_BADGE = {
  PENDING:  "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
};

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function FirstAidDetailDialog({
  requestSummary,
  open,
  onClose,
  onActionComplete,
}) {
  const [acting, setActing] = useState(null); // "APPROVED" | "REJECTED"
  const [error, setError] = useState("");

  const { data, loading } = useFetch(
    useCallback(() => {
      if (!requestSummary?.request_id) return Promise.resolve(null);
      return getAdminFirstAidRequestById(requestSummary.request_id);
    }, [requestSummary?.request_id]),
  );

  const detail = data?.data ?? null;
  const isPending = detail?.statue === "PENDING";

  const handleAction = async (status) => {
    setError("");
    setActing(status);
    try {
      await adminApproveFirstAidRequest(requestSummary.request_id, status);
      onActionComplete();
      onClose();
    } catch (err) {
      setError(err?.message || "Action failed. Try again.");
    } finally {
      setActing(null);
    }
  };

  if (!requestSummary) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4" />
            First Aid Request
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {requestSummary.request_id}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner className="py-10" />
        ) : detail ? (
          <div className="space-y-4">

            {/* ── Info card ── */}
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <InfoRow icon={User}     label="Requested by" value={detail.fullname} />
              <InfoRow icon={Calendar} label="Date"         value={new Date(detail.request_date).toLocaleDateString()} />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className={STATUS_BADGE[detail.statue] ?? ""}>
                  {detail.statue}
                </Badge>
              </div>
              {detail.trip_details && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Trip details</p>
                  <p className="text-sm">{detail.trip_details}</p>
                </div>
              )}
            </div>

            {/* ── Document photo ── */}
            {detail.document_url ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Supporting Document
                </p>
                <a href={detail.document_url} target="_blank" rel="noreferrer">
                  <img
                    src={detail.document_url}
                    alt="Supporting document"
                    className="w-full rounded-lg border object-contain max-h-56 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Click to open full size
                  </p>
                </a>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No document attached
              </div>
            )}

            {/* ── Requested medicines ── */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Pill className="size-3.5" />
                Requested Medicines
              </p>
              {detail.items?.length > 0 ? (
                <div className="rounded-lg border divide-y">
                  {detail.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">
                        Qty: <span className="font-semibold text-foreground">{item.quantity}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-3 border-2 border-dashed rounded-lg">
                  No items listed yet
                </p>
              )}
            </div>

            {/* ── Error ── */}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* ── Actions (pending only) ── */}
            {isPending && (
              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!!acting}
                  onClick={() => handleAction("APPROVED")}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {acting === "APPROVED" ? "Approving…" : "Approve"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  disabled={!!acting}
                  onClick={() => handleAction("REJECTED")}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  {acting === "REJECTED" ? "Rejecting…" : "Reject"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Could not load request details.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FirstAidDetailDialog;
import { useState, useCallback } from "react";
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
import { Textarea } from "../ui/textarea";
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
import { Plus, Minus, Backpack } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useDisclosure } from "../../hooks";
import {
  getFirstAidRequests,
  createFirstAidRequest,
  getMedicines,
} from "../../services/api";
import {
  LoadingSpinner,
  EmptyState,
  TableWrapper,
  getStatusVariant,
  FirstAidRequestDialog,           
} from "../shared";

export function FirstAidRequests() {
  const { user } = useAuth();

  // ── Dialog states ────────────────────────────────────────────
  const { isOpen, open, close } = useDisclosure();       // create dialog
  const viewDisclosure = useDisclosure();                // view detail dialog
  const [selectedRequest, setSelectedRequest] = useState(null);

  // ── Form state ───────────────────────────────────────────────
  const [tripDetails, setTripDetails] = useState("");
  const [selected, setSelected] = useState([]);

  // ── Data fetching ────────────────────────────────────────────
  const { data: req, loading, refetch } = useFetch(
    useCallback(() => getFirstAidRequests(user?.CardID), [user?.CardID]),
    [user?.CardID],
  );
  const requests = req?.data || [];

  const { data } = useFetch(getMedicines);
  const medicines = data?.data || [];

  // ── Mutation ─────────────────────────────────────────────────
  const { mutate: submit, loading: submitting } = useMutation(
    createFirstAidRequest,
    {
      successMessage: "First aid request submitted",
      onSuccess: () => {
        close();
        setTripDetails("");
        setSelected([]);
        refetch();
      },
    },
  );

  // ── Handlers ─────────────────────────────────────────────────
  const handleRowClick = (request) => {
    setSelectedRequest(request);
    viewDisclosure.open();
  };

  const toggleMedicine = (med) => {
    setSelected((prev) => {
      const exists = prev.find((m) => m.id === med.medicine_id);
      if (exists) return prev.filter((m) => m.id !== med.medicine_id);
      return [...prev, { id: med.medicine_id, name: med.name, quantity: 10 }];
    });
  };

  const updateQty = (id, qty) => {
    setSelected((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, quantity: Math.max(1, parseInt(qty) || 1) } : m,
      ),
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit({
      requestedBy: user.id,
      tripDetails,
      documentUrl: "",
      items: selected.map((m) => ({ medicineId: m.id, quantity: m.quantity })),
    });
  };

  return (
    <>
      {/* ── Requests Table ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>First Aid Requests</CardTitle>
              <CardDescription>
                Medicine requests for study tours. Click a row to view details.
              </CardDescription>
            </div>
            <Button onClick={open} size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Trip Details
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Items
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow
                      key={r.request_id}
                      className="cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => handleRowClick(r)}
                    >
                      <TableCell className="font-mono text-xs">
                        #{r.request_id}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(r.request_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm max-w-[200px] truncate">
                        {r.trip_details}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(r.statue)}>
                          {r.statue}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.items?.map((item, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {item.medicine_name} ×{item.quantity}
                          </p>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState
                          icon={Backpack}
                          title="No requests"
                          description="Submit a first aid request for your next study tour"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableWrapper>
          )}
        </CardContent>
      </Card>

      {/* ── Create Request Dialog ────────────────────────────── */}
      <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request First Aid Kit</DialogTitle>
            <DialogDescription>
              Provide study tour details and select required medicines
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Trip Details</Label>
              <Textarea
                rows={3}
                placeholder="e.g. 3-day tour to Cox's Bazar, 50 students"
                value={tripDetails}
                onChange={(e) => setTripDetails(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Select Medicines</Label>
              <div className="border rounded-lg divide-y max-h-44 overflow-y-auto">
                {medicines.map((med) => {
                  const isSelected = selected.some(
                    (m) => m.id === med.medicine_id,
                  );
                  return (
                    <div
                      key={med.medicine_id}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}
                      onClick={() => toggleMedicine(med)}
                    >
                      <span className="text-sm">{med.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {med.total_quantity ?? 0}
                        </Badge>
                        {isSelected && <Badge className="text-xs">✓</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selected.length > 0 && (
              <div className="space-y-2">
                <Label>Quantities</Label>
                {selected.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="flex-1 text-sm truncate">{m.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQty(m.id, m.quantity - 1)}
                        className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <Input
                        type="number"
                        value={m.quantity}
                        onChange={(e) => updateQty(m.id, e.target.value)}
                        className="w-16 h-7 text-center text-sm"
                        min={1}
                      />
                      <button
                        type="button"
                        onClick={() => updateQty(m.id, m.quantity + 1)}
                        className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !tripDetails}>
                {submitting ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── View Request Detail Dialog (read-only) ───────────── */}
      <FirstAidRequestDialog
        request={selectedRequest}
        open={viewDisclosure.isOpen}
        onClose={() => {
          viewDisclosure.close();
          setSelectedRequest(null);
        }}
      />
    </>
  );
}
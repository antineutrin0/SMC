import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge, Plus } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import RequestDialog from "./RequestDialog";
import RequestsTable from "./RequestTable";

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
    [user?.CardID]
  );

  const { data } = useFetch(getMedicines);
  const requests = req?.data || [];
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>First Aid Requests</CardTitle>
              <CardDescription>
                Medicine requests for study tours. Click a row to view details.
              </CardDescription>
            </div>
            <Button onClick={open} size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> New Request
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
          {/* <RequestsTable loading={loading} requests={req?.data || []} /> */}
        </CardContent>
      </Card>

      {/* ── Create Request Dialog ────────────────────────────── */}
      <RequestDialog
        isOpen={isOpen}
        close={close}
        medicines={data?.data || []}
        submitting={submitting}
        onSubmit={submit}
        user={user}
      />

      {/* ── View Request Detail Dialog (read-only) ───────────── */}
      <FirstAidRequestDialog
        request={requests.find((r) => r.request_id === selectedRequest?.request_id)}
        open={viewDisclosure.isOpen}
        onClose={() => {
          viewDisclosure.close();
          setSelectedRequest(null);
        }}
      />
    </>
  );
}
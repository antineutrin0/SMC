import { useState, useCallback } from "react";
import { useMemo } from "react";
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
import { Pill, Clock, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useDisclosure } from "../../hooks";
import {
  getPendingTokens,
  getPrescription,
  dispenseMedicine,
} from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";
import { TokenTable } from "./TokenTable";
import { DispenseDialog } from "./DispenseDialog";

export function PendingTokens() {
  const { user } = useAuth();
  const { isOpen, open, close } = useDisclosure();
  const [selectedToken, setSelectedToken] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [prescLoading, setPrescLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, loading, refetch } = useFetch(getPendingTokens); // Assuming getPendingTokens is defined elsewhere
  const tokens = data?.data ?? [];

  const filteredTokens = useMemo(() => {
    return tokens.filter((t) =>
      t.token_id.toString().includes(searchQuery.trim()),
    );
  }, [tokens, searchQuery]);

  const handleTokenClick = async (token) => {
    setSelectedToken(token);
    setPrescLoading(true);
    try {
      const presc = await getPrescription(token.visit_id);
      setPrescription(presc.data);
      const init = {};
      presc.data.medications?.forEach((m) => {
        init[m.medicine_id] = m.duration_day * m.frequency;
      });
      setQuantities(init);
      open();
    } finally {
      setPrescLoading(false);
    }
  };

  const { mutate: dispense, loading: dispensing } = useMutation(
    dispenseMedicine,
    {
      successMessage: "Medicine dispensed successfully",
      onSuccess: () => {
        close();
        setSelectedToken(null);
        setPrescription(null);
        setQuantities({});
        refetch();
      },
    },
  );

  const handleDispense = () => {
    if (!selectedToken || !prescription) return;
    dispense({
      tokenId: selectedToken.token_id,
      medicines: prescription.medications.map((m) => ({
        medicineId: m.medicine_id,
        quantity: quantities[m.medicine_id] || 0,
      })),
      employeeId: user.id,
    });
  };

  return (
    // Assuming Card, CardHeader, CardTitle, CardDescription, CardContent are defined elsewhere
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Prescription Tokens</CardTitle>
          <CardDescription>
            Patients waiting for medicine collection
          </CardDescription>
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by Token ID..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <TokenTable
              tokens={filteredTokens}
              onDispense={handleTokenClick}
              prescLoading={prescLoading}
            />
          )}
        </CardContent>
      </Card>
      <DispenseDialog
        isOpen={isOpen}
        onClose={close}
        selectedToken={selectedToken}
        prescription={prescription}
        quantities={quantities}
        dispensing={dispensing}
        onConfirm={handleDispense}
      />
    </>
  );
}

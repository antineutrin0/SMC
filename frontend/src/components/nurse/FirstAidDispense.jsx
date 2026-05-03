import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Search } from "lucide-react";

import { useFetch, useMutation, useDisclosure } from "../../hooks";
import {
  getProcessedFirstAidRequests,
  dispenseFirstAidRequest,
} from "../../services/api";

import { LoadingSpinner, TableWrapper } from "../shared";
import { FirstAidTable } from "./FirstAidTable";
import { FirstAidDispenseDialog } from "./FirstAidDispenseDialog";

export function FirstAidDispense() {
  const { isOpen, open, close } = useDisclosure();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, loading, refetch } = useFetch(getProcessedFirstAidRequests);
  const requests = data?.data ?? [];

  // 🔍 Search by patient name
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((r) =>
      r.fullname?.toLowerCase().includes(q)
    );
  }, [requests, searchQuery]);

  // 🧠 Open dialog
  const handleClick = (req) => {
    setSelectedRequest(req);
    open();
  };

  // 🚀 Dispense API
  const { mutate: dispense, loading: dispensing } = useMutation(
    dispenseFirstAidRequest,
    {
      successMessage: "First aid dispensed successfully",
      onSuccess: () => {
        close();
        setSelectedRequest(null);
        refetch();
      },
    }
  );

  const handleDispense = () => {
    if (!selectedRequest) return;

    dispense({
      requestId: selectedRequest.request_id,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>First Aid Requests</CardTitle>
          <CardDescription>
            Processed requests ready for dispensing
          </CardDescription>

          {/* 🔍 Search */}
          <div className="relative max-w-sm mt-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by patient name..."
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
            <TableWrapper>
              <FirstAidTable
                requests={filtered}
                onClick={handleClick}
              />
            </TableWrapper>
          )}
        </CardContent>
      </Card>

      <FirstAidDispenseDialog
        isOpen={isOpen}
        onClose={close}
        request={selectedRequest}
        dispensing={dispensing}
        onConfirm={handleDispense}
      />
    </>
  );
}
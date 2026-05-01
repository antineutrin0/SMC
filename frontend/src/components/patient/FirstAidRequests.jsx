import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useDisclosure } from "../../hooks";
import { getFirstAidRequests, createFirstAidRequest, getMedicines } from "../../services/api";
import RequestsTable from "./RequestTable";
import RequestDialog from "./RequestDialog";


export function FirstAidRequests() {
  const { user } = useAuth();
  const { isOpen, open, close } = useDisclosure();

  const { data: req, loading, refetch } = useFetch(
    useCallback(() => getFirstAidRequests(user?.CardID), [user?.CardID]),
    [user?.CardID]
  );

  const { data } = useFetch(getMedicines);

  const { mutate: submit, loading: submitting } = useMutation(createFirstAidRequest, {
    successMessage: "First aid request submitted",
    onSuccess: () => {
      close();
      refetch();
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>First Aid Requests</CardTitle>
              <CardDescription>Medicine requests for study tours</CardDescription>
            </div>
            <Button onClick={open} size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> New Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RequestsTable loading={loading} requests={req?.data || []} />
        </CardContent>
      </Card>

      <RequestDialog
        isOpen={isOpen}
        close={close}
        medicines={data?.data || []}
        submitting={submitting}
        onSubmit={submit}
        user={user}
      />
    </>
  );
}
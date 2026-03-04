import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Package } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation } from "../../hooks";
import {
  getFirstAidRequestsPharmacist,
  approveFirstAidRequest,
} from "../../services/api";
import {
  LoadingSpinner,
  EmptyState,
  TableWrapper,
  getStatusVariant,
} from "../shared";

export function PharmacistFirstAid() {
  const { user } = useAuth();
  const { data, loading, refetch } = useFetch(getFirstAidRequestsPharmacist);
  const requests = data?.data ?? [];

  const { mutate: review } = useMutation(
    (id, status) =>
      approveFirstAidRequest(id, { status, reviewerId: user?.id }),
    { onSuccess: refetch },
  );

  const handleAction = async (id, status) => {
    const result = await review(id, status);
    if (result?.success) refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>First Aid Requests</CardTitle>
        <CardDescription>
          Review and approve study tour medicine requests
        </CardDescription>
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
                  <TableHead>Requester</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Trip Details
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.request_id}>
                    <TableCell className="font-mono text-xs">
                      #{r.request_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.requester_name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm max-w-[160px] truncate">
                      {r.trip_details}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(r.request_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(r.statue)}>
                        {r.statue}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.statue === "PENDING" && (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAction(r.request_id, "APPROVED")
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleAction(r.request_id, "REJECTED")
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        icon={Package}
                        title="No first aid requests"
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
  );
}

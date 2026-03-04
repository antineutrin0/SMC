import { useCallback } from "react";
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
import { FileText } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation } from "../../hooks";
import {
  getMedicalCardApplications,
  reviewApplication,
} from "../../services/api";
import {
  LoadingSpinner,
  EmptyState,
  TableWrapper,
  getStatusVariant,
} from "../shared";

export function ApplicationReviews() {
  const { user } = useAuth();
  const { data, loading, refetch } = useFetch(getMedicalCardApplications);
  const applications = data?.data ?? [];

  const { mutate: review } = useMutation(
    useCallback(
      (id, status) =>
        reviewApplication(id, {
          status,
          reviewerId: user.id,
          comments:
            status === "Approved"
              ? "Application approved"
              : "Application rejected",
        }),
      [user?.id],
    ),
    {
      onSuccess: (_, [, status]) => {
        refetch();
      },
    },
  );

  const handleReview = async (id, status) => {
    const result = await review(id, status);
    if (result?.success) refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical Card Applications</CardTitle>
        <CardDescription>Review and process new applications</CardDescription>
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
                  <TableHead>Applicant</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Applied
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.ApplicationID}>
                    <TableCell className="font-mono text-xs">
                      #{app.ApplicationID}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{app.fullname}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.contact_number}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{app.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(app.ApplicationDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(app.ApplicationStatus)}>
                        {app.ApplicationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.ApplicationStatus === "Pending" && (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleReview(app.ApplicationID, "Approved")
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleReview(app.ApplicationID, "Rejected")
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        icon={FileText}
                        title="No applications"
                        description="All applications have been processed"
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

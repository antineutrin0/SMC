import { useCallback, useState } from "react";
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
  approveMedicalCard,
  getMedicalCardApplications,
  reviewApplication,
} from "../../services/api";
import {
  LoadingSpinner,
  EmptyState,
  TableWrapper,
  getStatusVariant,
} from "../shared";
import { ApplicationDetailDialog } from "../shared/ApplicationDetailDialog";

export function ApplicationReviews() {
  const { user } = useAuth();
  const [selectedApp, setSelectedApp] = useState(null);

  const { data, loading, refetch } = useFetch(getMedicalCardApplications);
  const applications = data?.data ?? [];

  // ── Shared review mutation — used by both table buttons and dialog ──
  const { mutate: review } = useMutation(
    useCallback(
      (id, status) =>
        approveMedicalCard({
          applicationId: id,
          status,
          comments:
            status === "Approved"
              ? "approved"
              : "rejected",
        }),
      [user?.id],
    ),
    { onSuccess: refetch },
  );

  // Called from table action buttons
  const handleTableReview = (e, id, status) => {
    e.stopPropagation(); // prevent row click opening dialog
    review(id, status);
  };

  // Called from dialog footer buttons — signature matches table handler
  const handleDialogReview = (id, status) => {
    review(id, status);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Medical Card Applications</CardTitle>
          <CardDescription>
            Review and process new applications. Click a row to view full
            details.
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
                    <TableHead>Applicant</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Contact
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Applied
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow
                      key={app.ApplicationID}
                      className="cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => setSelectedApp(app)}
                    >
                      <TableCell className="font-mono text-xs">
                        #{app.ApplicationID}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{app.fullname}</p>
                        {app.email && (
                          <p className="text-xs text-muted-foreground">
                            {app.email}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {app.contact_number || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{app.type}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
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
                              onClick={(e) =>
                                handleTableReview(e, app.ApplicationID, "Approved")
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) =>
                                handleTableReview(e, app.ApplicationID, "Rejected")
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
                      <TableCell colSpan={7}>
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

      {/* ── Application Detail Dialog ────────────────────────── */}
      <ApplicationDetailDialog
        application={selectedApp}
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        onReview={handleDialogReview}
      />
    </>
  );
}
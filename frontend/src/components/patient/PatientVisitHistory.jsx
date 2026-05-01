import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch } from "../../hooks";
import { getPatientVisits } from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";
import { PrescriptionDialog } from "../shared/PrescriptionDialog";

export function PatientVisitHistory() {
  const { user } = useAuth();
  const { data, loading } = useFetch(
    useCallback(() => getPatientVisits(user?.CardID), [user?.CardID]),
    [user?.CardID],
  );
  const visits = data?.data || [];

  const [selectedVisit, setSelectedVisit] = useState(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Visit History</CardTitle>
          <CardDescription>
            Click any row to view the full prescription
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
                    <TableHead>Date</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Symptoms
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Advice
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((v) => (
                    <TableRow
                      key={v.visit_id}
                      className="cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => setSelectedVisit(v)}
                    >
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(v.visit_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {v.doctor_name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {v.symptoms || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {v.advice || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {visits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState
                          icon={Calendar}
                          title="No visits found"
                          description="Your visit history will appear here"
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

      <PrescriptionDialog
        visit={selectedVisit}
        open={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
      />
    </>
  );
}
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
import { Calendar, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch } from "../../hooks";
import { getPatientVisits } from "../../services/api";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";
import { PrescriptionDialog } from "../shared/PrescriptionDialog";
import { SearchBar, useVisitFilter } from "../shared/SearchBar";

export function PatientVisitHistory() {
  const { user } = useAuth();
  const { data, loading } = useFetch(
    useCallback(() => getPatientVisits(user?.CardID), [user?.CardID]),
    [user?.CardID],
  );
  const visits = data?.data || [];

  const [selectedVisit, setSelectedVisit] = useState(null);

  const { query, setQuery, date, setDate, filtered, isFiltering } =
    useVisitFilter(visits);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle>Visit History</CardTitle>
              <CardDescription>
                Click any row to view the full prescription
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Doctor name search */}
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search by doctor name…"
              />

              {/* Native date input — value is "YYYY-MM-DD" or "" */}
              <div className="relative flex items-center w-full max-w-sm">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full h-9 rounded-md border border-input bg-transparent pl-9 pr-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                {date && (
                  <button
                    type="button"
                    onClick={() => setDate("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear date filter"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
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
                  {filtered.map((v, index) => (
                    <TableRow
                      key={`${v.visit_id}-${index}`}
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

                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState
                          icon={Calendar}
                          title={
                            isFiltering
                              ? "No visits match your filters"
                              : "No visits found"
                          }
                          description={
                            isFiltering
                              ? "Try a different doctor name or date"
                              : "Your visit history will appear here"
                          }
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

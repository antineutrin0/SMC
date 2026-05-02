import React, { useState } from "react";
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
import { Plus, Calendar } from "lucide-react";
import { LoadingSpinner, EmptyState, TableWrapper } from "../shared";
import TokenDialog from "./TokenDialog";

export function VisitsTable({ visits, loading, handleRowClick, handleAddRx }) {
  const [tokenOpenFor, setTokenOpenFor] = useState(null);
  const [tokensCreated, setTokensCreated] = useState(new Set());

  const handleTokenCreated = (visitId) => {
    setTokensCreated((s) => new Set([...Array.from(s), visitId]));
  };

  const handleOpenToken = (visit) => setTokenOpenFor(visit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation History</CardTitle>
        <CardDescription>
          All patient visits you have handled. Click a completed row to view
          prescription.
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
                  <TableHead>Card ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Symptoms</TableHead>
                  <TableHead className="hidden lg:table-cell">Advice</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v) => (
                  <TableRow
                    key={v.visit_id}
                    className={
                      v.symptoms
                        ? "cursor-pointer hover:bg-muted/60 transition-colors"
                        : undefined
                    }
                    onClick={() => handleRowClick(v)}
                  >
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(v.visit_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{v.card_id}</TableCell>
                    <TableCell className="font-medium">{v.patient_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[160px] truncate">
                      {v.symptoms || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[160px] truncate">
                      {v.advice || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!v.symptoms ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddRx(v);
                            }}
                          >
                            Add Rx
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenToken(v);
                              }}
                              disabled={!!v.hastoken || tokensCreated.has(v.visit_id)}
                              className={
                                !!v.hastoken || tokensCreated.has(v.visit_id)
                                  ? "bg-gray-400 text-gray-800 border-gray-200"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }
                            >
                              {v.hastoken || tokensCreated.has(v.visit_id) ? "Token Created" : "Add Token"}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {visits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState icon={Calendar} title="No visits yet" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        )}
      </CardContent>

      <TokenDialog
        visit={tokenOpenFor}
        open={!!tokenOpenFor}
        onClose={() => setTokenOpenFor(null)}
        onCreated={handleTokenCreated}
      />
    </Card>
  );
}

export default VisitsTable;

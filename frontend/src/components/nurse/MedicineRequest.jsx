import { useCallback } from "react";
import { Plus } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { useFetch, useMutation, useDisclosure } from "../../hooks";
import {
  getPharmacistMedicines,
  createNurseMedicineRequest,
  getMedicines,
  getRequisitionHistory,
} from "../../services/api";
import { LoadingSpinner } from "../shared";
import { RequestMedicineTable } from "./RequestMedicineTable";
import { RequestMedicineDialog } from "./RequestMedicineDialog";

export default function MedicineRequest() {
  const { user } = useAuth();
  const { isOpen, open, close } = useDisclosure();

  // Fetch History
  const {
    data: historyData,
    loading,
    refetch,
  } = useFetch(
    useCallback(() => getRequisitionHistory(user?.id), [user?.id]),
    [user?.id],
  );

  const history = historyData?.data || [];

  // Fetch Medicines for the selection dialog
  const { data: medData } = useFetch(getMedicines);
  const medicines = medData?.data || [];

  // Mutation for creating a new request
  const { mutate: submitRequest, loading: submitting } = useMutation(
    createNurseMedicineRequest,
    {
      successMessage: "Medicine request submitted successfully",
      onSuccess: () => {
        close();
        refetch();
      },
    },
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Medicine Stock Requests</CardTitle>
            <CardDescription>
              Track and manage inventory replenishment requests.
            </CardDescription>
          </div>
          <Button onClick={open} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <RequestMedicineTable history={history} />
          )}
        </CardContent>
      </Card>

      <RequestMedicineDialog
        isOpen={isOpen}
        onClose={close}
        medicines={medicines}
        onSubmit={submitRequest}
        loading={submitting}
        nurseId={user?.id}
      />
    </div>
  );
}

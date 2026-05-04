import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { PageLoader } from "./components/shared";
import { FirstAidRequests } from "./components/doctor/FirstAidRequests";
import AdminFirstAidPage from "./pages/admin/AdminFirstAidPage";

// ─── Lazy load pages ──────────────────────────────────────────
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ApplyMedicalCardPage = lazy(() => import("./pages/ApplyMedicalCardPage"));

// Admin
const AdminOverviewPage = lazy(() => import("./pages/admin/AdminOverviewPage"));
const AdminEmployeesPage = lazy(
  () => import("./pages/admin/AdminEmployeesPage"),
);
const AdminRostersPage = lazy(() => import("./pages/admin/AdminRostersPage"));
const AdminApplicationsPage = lazy(
  () => import("./pages/admin/AdminApplicationsPage"),
);
const AdminInventoryPage = lazy(
  () => import("./pages/admin/AdminInventoryPage"),
);
const AdminTransactionsPage = lazy(
  () => import("./pages/admin/AdminTransactionsHistory"),
);
// const AdminFirstAidPage = lazy(() => import("./pages/admin/AdminFirstAidPage"));
// Doctor
const DoctorVisitsPage = lazy(() => import("./pages/doctor/DoctorVisitsPage"));
const DoctorMedicinesPage = lazy(
  () => import("./pages/doctor/DoctorMedicinesPage"),
);
const VerifyStudent = lazy(
  () => import("./components/doctor/StudentVerfication"),
);

// Nurse
const NurseTokensPage = lazy(() => import("./pages/nurse/NurseTokensPage"));
const NurseHistoryPage = lazy(() => import("./pages/nurse/NurseHistoryPage"));
const NurseRequestPage = lazy(() => import("./pages/nurse/NurseRequestPage"));
const NurseSubstoreInventoryPage = lazy(
  () => import("./pages/nurse/NurseSubstoreInventoryPage"),
);
const NurseFirstAidDispensePage = lazy(
  () => import("./pages/nurse/NurseFirstAidDispensePage"),
);

// Pharmacist
const PharmacistInventoryPage = lazy(
  () => import("./pages/pharmacist/PharmacistInventoryPage"),
);
const PharmacistTransactionsPage = lazy(
  () => import("./pages/pharmacist/PharmacistTransactionsPage"),
);
const PharmacistFirstAidPage = lazy(
  () => import("./pages/pharmacist/PharmacistFirstAidPage"),
);

// Patient
const PatientProfilePage = lazy(
  () => import("./pages/patient/PatientProfilePage"),
);
const PatientVisitsPage = lazy(
  () => import("./pages/patient/PatientVisitsPage"),
);
const PatientFirstAidPage = lazy(
  () => import("./pages/patient/PatientFirstAidPage"),
);

// Driver
const DriverLogsPage = lazy(() => import("./pages/driver/DriverLogsPage"));

// ─── Role-based default routes ────────────────────────────────
const DEFAULT_ROUTE = {
  Patient: "/dashboard",
  Doctor: "/dashboard",
  Nurse: "/dashboard",
  Pharmacist: "/dashboard",
  Driver: "/dashboard",
  Admin: "/dashboard",
};

// ─── Protected Route ──────────────────────────────────────────
function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.type)) {
    return <Navigate to={DEFAULT_ROUTE[user.type] || "/login"} replace />;
  }
  return <Outlet />;
}

// ─── Redirect if already logged in ───────────────────────────
function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user)
    return <Navigate to={DEFAULT_ROUTE[user.type] || "/dashboard"} replace />;
  return <Outlet />;
}

// ─── Dashboard wrapper ────────────────────────────────────────
function DashboardWrapper() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────
function DashboardHome() {
  const { user } = useAuth();
  if (!user) return null;

  switch (user.type) {
    case "Admin":
      return <AdminOverviewPage />;
    case "Doctor":
      return <DoctorVisitsPage />;
    case "Nurse":
      return <NurseTokensPage />;
    case "Registrar":
      return <PharmacistInventoryPage />;
    case "Driver":
      return <DriverLogsPage />;
    case "Patient":
      return <PatientProfilePage />;
    default:
      return <Navigate to="/" replace />;
  }
}

// ─── Router ───────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        }
      />

      {/* Guest only */}
      <Route element={<GuestRoute />}>
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/apply"
          element={
            <Suspense fallback={<PageLoader />}>
              <ApplyMedicalCardPage />
            </Suspense>
          }
        />
      </Route>

      {/* Dashboard — role-protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardWrapper />}>
          <Route index element={<DashboardHome />} />
          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="employees" element={<AdminEmployeesPage />} />
            <Route path="rosters" element={<AdminRostersPage />} />
            <Route path="applications" element={<AdminApplicationsPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="firstaidrequest" element={<AdminFirstAidPage />} />
          </Route>

          {/* Doctor */}
          <Route element={<ProtectedRoute allowedRoles={["Doctor"]} />}>
            <Route path="medicines" element={<DoctorMedicinesPage />} />
            <Route path="verify" element={<VerifyStudent />} />
            <Route path="/dashboard/firstaid" element={<FirstAidRequests />} />
          </Route>

          {/* Nurse */}
          <Route element={<ProtectedRoute allowedRoles={["Nurse"]} />}>
            <Route path="history" element={<NurseHistoryPage />} />
            <Route path="requests" element={<NurseRequestPage />} />
            <Route path="substore-inventory" element={<NurseSubstoreInventoryPage />} />
            <Route path="first-aid" element={<NurseFirstAidDispensePage />} />
          </Route>

          {/* Pharmacist */}
          <Route element={<ProtectedRoute allowedRoles={["Registrar"]} />}>
            <Route
              path="transactions-pharmacist"
              element={<PharmacistTransactionsPage />}
            />
            <Route
              path="firstaidrequest"
              element={<PharmacistFirstAidPage />}
            />
          </Route>

          {/* Patient */}
          <Route element={<ProtectedRoute allowedRoles={["Patient"]} />}>
            <Route path="visits" element={<PatientVisitsPage />} />
            <Route path="first-aid-request" element={<PatientFirstAidPage />} />
          </Route>

          {/* Driver */}
          <Route element={<ProtectedRoute allowedRoles={["Driver"]} />}></Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
}

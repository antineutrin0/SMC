// ─────────────────────────────────────────────────────────────
// Dashboard Pages — each role maps to separate route pages
// ─────────────────────────────────────────────────────────────

// ADMIN PAGES
export { default as AdminOverviewPage } from "./admin/AdminOverviewPage";
export { default as AdminEmployeesPage } from "./admin/AdminEmployeesPage";
export { default as AdminRostersPage } from "./admin/AdminRostersPage";
export { default as AdminApplicationsPage } from "./admin/AdminApplicationsPage";

// DOCTOR PAGES
export { default as DoctorVisitsPage } from "./doctor/DoctorVisitsPage";
export { default as DoctorMedicinesPage } from "./doctor/DoctorMedicinesPage";

// NURSE PAGES
export { default as NurseTokensPage } from "./nurse/NurseTokensPage";
export { default as NurseHistoryPage } from "./nurse/NurseHistoryPage";

// PHARMACIST PAGES
export { default as PharmacistInventoryPage } from "./pharmacist/PharmacistInventoryPage";
export { default as PharmacistTransactionsPage } from "./pharmacist/PharmacistTransactionsPage";
export { default as PharmacistFirstAidPage } from "./pharmacist/PharmacistFirstAidPage";

// PATIENT PAGES
export { default as PatientProfilePage } from "./patient/PatientProfilePage";
export { default as PatientVisitsPage } from "./patient/PatientVisitsPage";
export { default as PatientFirstAidPage } from "./patient/PatientFirstAidPage";

// DRIVER PAGES
export { default as DriverLogsPage } from "./driver/DriverLogsPage";

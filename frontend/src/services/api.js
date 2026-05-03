// ============================================================
// API Service Layer - Full Backend Integration
// Base URL configurable via environment variable
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── HTTP Helpers ────────────────────────────────────────────

const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

async function request(method, endpoint, body = null) {
  const config = {
    method,
    headers: getAuthHeaders(),
  };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

const get = (url) => request("GET", url);
const post = (url, body) => request("POST", url, body);
const put = (url, body) => request("PUT", url, body);
const patch = (url, body) => request("PATCH", url, body);
const del = (url) => request("DELETE", url);

// ─── Auth ─────────────────────────────────────────────────────

export const login = (userType, identifier, password) =>
  post("/auth/login", { userType, identifier, password });

export const logout = () => post("/auth/logout");
export const getMe = () => get("/auth/me");

// ─── Public (no auth required) ───────────────────────────────

export const getPublicRoster = () => get("/public/roster");
export const getPublicEmployees = () => get("/public/employees");
export const getServices = () => get("/public/services");
export const getMedicalCenterInfo = () => get("/public/info");

// ─── Admin ───────────────────────────────────────────────────

export const getDashboardStats = () => get("/admin/stats");
export const getEmployees = () => get("/admin/employees");
export const getRosters = () => get("/admin/rosters");
export const createRoster = (data) => post("/admin/rosters", data);
export const updateRoster = (id, data) => put(`/admin/rosters/${id}`, data);
export const approveRoster = (id, adminId) =>
  patch(`/admin/rosters/${id}/approve`, { adminId });
export const deleteRoster = (id) => del(`/admin/rosters/${id}`);

export const getMedicalCardApplications = () => get("/admin/applications");
export const reviewApplication = (id, data) =>
  patch(`/admin/applications/${id}/review`, data);

// ─── Doctor ──────────────────────────────────────────────────

export const getDoctorVisits = (doctorId) => get(`/doctor/${doctorId}/visits`);
export const createVisit = (data) => post("/doctor/visits", data);
export const createPrescription = (data) => post("/doctor/prescriptions", data);
export const getMedicines = () => get("/public/medicines");
// Tokens
export const createToken = (data) => post("/doctor/createtokens", data);

// ─── Patient ─────────────────────────────────────────────────

export const getPatientProfile = (patientId) =>
  get(`/patient/${patientId}/profile`);
export const getPatientVisits = (patientId) =>
  get(`/patient/${patientId}/visits`);
export const getFirstAidRequests = (patientId) =>
  get(`/patient/${patientId}/first-aid`);
export const createFirstAidRequest = (data) => post("/patient/first-aid", data);
export const applyForMedicalCard = (data) => post("/patient/apply", data);
export const getVisitPrescription = (visitId) =>
  apiClient.get(`/visits/${visitId}/prescriptions`);
export const getFirstAidRequestDetail = (requestId) =>
  apiClient.get(`/first-aid/requests/${requestId}`);

// ─── Nurse ───────────────────────────────────────────────────

export const getPendingTokens = () => get("/nurse/tokens/pending");
export const getPrescription = (visitId) =>
  get(`/nurse/prescription/${visitId}`);
export const dispenseMedicine = (data) => post("/nurse/dispense", data);
export const getNurseHistory = (nurseId) => get(`/nurse/${nurseId}/history`);
export const createNurseMedicineRequest = (data) =>
  post("/nurse/requisition", data);
export const getRequisitionHistory = (nurseId) =>
  get(`/nurse/requisition/history`);

// ─── Pharmacist ──────────────────────────────────────────────

export const getPharmacistMedicines = () => get("/pharmacist/medicines");
export const addMedicine = (data) => post("/pharmacist/medicines", data);
export const updateMedicine = (id, data) =>
  put(`/pharmacist/medicines/${id}`, data);
export const addInventory = (data) => post("/pharmacist/inventory", data);
export const getTransactions = () => get("/pharmacist/transactions");
export const getFirstAidRequestsPharmacist = () => get("/pharmacist/first-aid");
export const approveFirstAidRequest = (id, data) =>
  patch(`/pharmacist/first-aid/${id}`, data);

// ─── Driver ──────────────────────────────────────────────────

export const getAmbulanceLogs = (driverId) => get(`/driver/${driverId}/logs`);
export const createAmbulanceLog = (data) => post("/driver/logs", data);
export const updateAmbulanceLog = (id, data) =>
  patch(`/driver/logs/${id}`, data);
export const completeTrip = (id, returnTime, finalKms) =>
  patch(`/driver/logs/${id}/complete`, { returnTime, finalKms });

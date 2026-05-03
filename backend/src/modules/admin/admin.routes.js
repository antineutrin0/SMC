const router = require("express").Router();
const ctrl = require("./admin.controller");
const { verifyToken, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

// All admin routes require authentication + Administrator role
router.use(verifyToken, requireRole("Admin"));

// Dashboard
router.get("/stats", ctrl.getDashboardStats);

// employees
router.get("/employees", ctrl.getEmployees);
router.get("/employees/:employeeId", ctrl.getEmployeeById);
router.post(
  "/employees",
  validate([
    "designation",
    "fullname",
    "contact_no",
    "email",
    "password",
    "photo_url",
  ]),
  ctrl.createEmployee,
);

// Medical Card Applications
router.get("/applications", ctrl.getApplications);
// router.patch(
//   "/applications/:applicationId/review",
//   validate(["status"]),
//   ctrl.reviewApplication,
// );

router.post(
  "/applications/approve",
  ctrl.approveMedicalCard,
);

// Rosters
router.get("/rosters", ctrl.getRosters);
router.post(
  "/rosters",
  validate(["employeeId", "dutyType", "startDate", "endDate"]),
  ctrl.createRoster,
);
router.patch("/rosters/:rosterId/publish", ctrl.publishRoster);
router.put("/rosters/:rosterId", ctrl.updateRoster);
router.delete("/rosters/:rosterId", ctrl.deleteRoster);

// Patients
router.get("/patients", ctrl.getPatients);

// First Aid
router.patch(
  "/first-aid/:requestId",
  validate(["status"]),
  ctrl.approveFirstAidRequest,
);

// employees

router.put("/employees/:employeeId", ctrl.updateEmployee);

router.patch("/employees/:employeeId/status", ctrl.updateEmployeeStatus);

router.patch(
  "/employees/:employeeId/reset-password",
  ctrl.resetEmployeePassword,
);

// applications

router.get("/applications/:applicationId", ctrl.getApplicationById);

// cards

router.get("/cards", ctrl.getCards);

router.patch("/cards/:cardId/status", ctrl.updateCardStatus);

router.patch("/cards/:cardId/extend", ctrl.extendCardExpiry);

// inventory

router.get("/inventory", ctrl.getInventory);

router.get("/transactions", ctrl.getTransactions);

// ambulance

router.get("/ambulance", ctrl.getAmbulanceLogs);

// first aid

router.get("/first-aid", ctrl.getFirstAidRequests);

router.get("/first-aid/:requestId", ctrl.getFirstAidRequestById);

module.exports = router;

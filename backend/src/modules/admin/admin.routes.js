const router = require("express").Router();
const ctrl = require("./admin.controller");
const { verifyToken, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

// All admin routes require authentication + Administrator role
router.use(verifyToken, requireRole("Admin"));

// Dashboard
router.get("/stats", ctrl.getDashboardStats);

// Employees
router.get("/employees", ctrl.getEmployees);
router.get("/employees/:employeeId", ctrl.getEmployeeById);

// Medical Card Applications
router.get("/applications", ctrl.getApplications);
router.patch(
  "/applications/:applicationId/review",
  validate(["status"]),
  ctrl.reviewApplication,
);
router.post(
  "/applications/approve-card",
  validate(["applicationId", "personId", "cardId", "password"]),
  ctrl.approveMedicalCard,
);

// Rosters
router.get("/rosters", ctrl.getRosters);
router.post(
  "/rosters",
  validate(["employeeId", "dutyType", "startDate", "endDate"]),
  ctrl.createRoster,
);
router.patch("/rosters/:rosterId/approve", ctrl.approveRoster);
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

module.exports = router;

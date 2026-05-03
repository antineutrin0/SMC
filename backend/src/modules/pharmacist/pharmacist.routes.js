const router = require("express").Router();
const ctrl = require("./pharmacist.controller");
const { verifyToken, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

router.use(verifyToken, requireRole("Registrar", "Nurse", "Doctor", "Admin"));

// Medicines
router.get("/medicines", ctrl.getMedicines);
router.post("/medicines", validate(["name"]), ctrl.addMedicine);
router.put("/medicines/:id", ctrl.updateMedicine);
router.delete("/medicines/:id", ctrl.deleteMedicine);

// Inventory
router.post(
  "/inventory",
  validate(["medicineId", "quantity", "expDate"]),
  ctrl.addInventory,
);
router.get("/inventory/:medicineId", ctrl.getInventory);

// Transactions
router.get("/transactions", ctrl.getTransactions);

// First Aid
router.get("/first-aid", ctrl.getFirstAidRequests);
router.patch(
  "/first-aid/:id",
  validate(["status"]),
  ctrl.reviewFirstAidRequest,
);

// Requisitions
router.get("/requisitions", ctrl.getRequisitions);
router.post("/requisitions/:id/process", ctrl.processRequisition);

// Processed First Aid Requests
router.get("/first-aid/processed", ctrl.getProcessedFirstAidRequests);

// Dispense First Aid Request (Pharmacist action after doctor processes it)
router.post("/first-aid/:id/dispense", ctrl.dispenseFirstAidRequest);

module.exports = router;

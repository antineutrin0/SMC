const router = require("express").Router();
const ctrl = require("./nurse.controller");
const { verifyToken, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

router.use(verifyToken, requireRole("Nurse", "Doctor"));

router.get("/tokens/pending", ctrl.getPendingTokens);
router.get("/prescription/:visitId", ctrl.getPrescription);
router.post(
  "/dispense",
  validate(["tokenId", "medicines"]),
  ctrl.dispenseMedicine,
);
router.get("/:nurseId/history", ctrl.getDispensationHistory);
router.post("/requisition", ctrl.createRequisition);
router.get("/requisition/history", ctrl.getRequisitionHistory);
router.get("/substore-inventory", ctrl.getSubstoreInventory);

// Processed First Aid Requests
router.get("/first-aid/processed", ctrl.getProcessedFirstAidRequests);

// Dispense First Aid Request (Pharmacist action after doctor processes it)
router.post("/first-aid/:id/dispense", ctrl.dispenseFirstAidRequest);
router.get("/first-aid/:id", ctrl.getFirstAidRequestDetails);

module.exports = router;

const router   = require("express").Router();
const ctrl     = require("./nurse.controller");
const { verifyToken, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

router.use(verifyToken, requireRole("Nurse","Doctor"));

router.get("/tokens/pending",          ctrl.getPendingTokens);
router.get("/prescription/:visitId",   ctrl.getPrescription);
router.post("/dispense", validate(["tokenId", "medicines"]), ctrl.dispenseMedicine);
router.get("/:nurseId/history",        ctrl.getDispensationHistory);
router.post("/requisition",  ctrl.createRequisition);

module.exports = router;

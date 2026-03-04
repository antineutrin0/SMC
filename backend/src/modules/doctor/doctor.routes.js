const router   = require("express").Router();
const ctrl     = require("./doctor.controller");
const { verifyToken, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

router.use(verifyToken, requireRole("Doctor"));

router.get("/:doctorId/visits",   ctrl.getVisits);
router.post("/visits",            validate(["cardId"]), ctrl.createVisit);
router.post("/prescriptions",     validate(["visitId", "symptoms"]), ctrl.createPrescription);
router.get("/prescriptions/:visitId", ctrl.getPrescription);
router.get("/medicines",          ctrl.getMedicines);

module.exports = router;

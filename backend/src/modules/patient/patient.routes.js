const router   = require("express").Router();
const ctrl     = require("./patient.controller");
const { verifyToken, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

// Public — anyone can apply for a medical card
router.post("/apply", ctrl.applyForMedicalCard);

// Protected — Patient only
router.use(verifyToken, requireRole("Patient"));

router.get("/:patientId/profile", ctrl.getProfile);
router.get("/:patientId/visits",  ctrl.getVisits);
router.get("/:patientId/first-aid", ctrl.getFirstAidRequests);
router.post("/first-aid", validate(["tripDetails"]), ctrl.createFirstAidRequest);
router.get("/prescription/:visitId", ctrl.getPrescription);
module.exports = router;

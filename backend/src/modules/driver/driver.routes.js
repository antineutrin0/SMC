const router   = require("express").Router();
const ctrl     = require("./driver.controller");
const { verifyToken, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

router.use(verifyToken, requireRole("Driver"));

router.get("/:driverId/logs",           ctrl.getLogs);
router.get("/logs/all",                  ctrl.getAllLogs);
router.post("/logs", validate(["patientId", "pickupLocation", "destination"]), ctrl.createLog);
router.patch("/logs/:logId/complete",    ctrl.completeTrip);
router.patch("/logs/:logId",             ctrl.updateLog);

module.exports = router;

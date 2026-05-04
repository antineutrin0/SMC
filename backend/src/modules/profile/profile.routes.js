const router = require("express").Router();
const ctrl = require("./profile.controller");
const { verifyToken, requireRole } = require("../../middleware/auth");

// All employee roles — not Patient
router.use(verifyToken, requireRole("Doctor", "Nurse", "Registrar", "Driver", "Admin"));

router.get("/me", ctrl.getProfile);
router.put("/me", ctrl.updateProfile);
router.patch("/me/password", ctrl.changePassword);

module.exports = router;
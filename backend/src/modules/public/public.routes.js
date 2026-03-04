const router = require("express").Router();
const {
  getRoster,
  getEmployees,
  getServices,
  getInfo,
} = require("./public.controller");
const { getMedicines } = require("../doctor/doctor.controller");
router.get("/roster", getRoster);
router.get("/employees", getEmployees);
router.get("/services", getServices);
router.get("/info", getInfo);
router.get("/medicines", getMedicines);
module.exports = router;

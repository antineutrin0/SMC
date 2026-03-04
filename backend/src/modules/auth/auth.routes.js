const router      = require("express").Router();
const { login, getMe } = require("./auth.controller");
const { verifyToken } = require("../../middleware/auth");
const validate        = require("../../middleware/validate");

// POST /api/auth/login
router.post("/login", validate(["userType", "identifier", "password"]), login);

// GET /api/auth/me  (protected)
router.get("/me", verifyToken, getMe);

module.exports = router;

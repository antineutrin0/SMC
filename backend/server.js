require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorHandler = require("./src/middleware/errorHandler");
const db = require("./src/config/db");

// ── Boot DB connection check 
db.getConnection()
  .then((conn) => {
    console.log("Database connected");
    conn.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });

const app = express();

// ── Global Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes 
app.use("/api/auth", require("./src/modules/auth/auth.routes"));
app.use("/api/public", require("./src/modules/public/public.routes"));
app.use("/api/admin", require("./src/modules/admin/admin.routes"));
app.use("/api/doctor", require("./src/modules/doctor/doctor.routes"));
app.use("/api/patient", require("./src/modules/patient/patient.routes"));
app.use("/api/nurse", require("./src/modules/nurse/nurse.routes"));
app.use("/api/pharmacist", require("./src/modules/pharmacist/pharmacist.routes"));
app.use("/api/driver", require("./src/modules/driver/driver.routes"));
app.use("/api/profile", require("./src/modules/profile/profile.routes"));

// ── Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SUST Medical Centre API is running",
    timestamp: new Date(),
  });
});

// ── 404 catch-all 
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ── Global error handler
app.use(errorHandler);

// ── Start 
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` API base: http://localhost:${PORT}/api`);
});

module.exports = app;

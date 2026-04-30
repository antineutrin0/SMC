const db = require("../../config/db");
const bcrypt = require("bcrypt");
const { sign } = require("../../utils/jwt");
const {
  ok,
  unauthorized,
  serverError,
  badRequest,
} = require("../../utils/response");

/**
 * POST /api/auth/login
 * body: { userType, identifier, password }
 *
 * userType: 'patient' | 'doctor' | 'nurse' | 'pharmacist' | 'driver' | 'admin'
 * identifier: CardID (patient) or employee_id (staff)
 */
const login = async (req, res) => {
  try {
    const { userType, identifier, password } = req.body;

    if (!userType || !identifier || !password) {
      return badRequest(res, "userType, identifier and password are required");
    }

    let user = null;
    let role = null;
    let name = null;

    if (userType === "patient") {
      const [rows] = await db.query(
        `SELECT mc.*, p.fullname
         FROM MedicalCard mc
         JOIN Person p ON mc.PersonID = p.person_id
         WHERE mc.CardID = ?`,
        [identifier],
      );

      if (rows.length === 0) return unauthorized(res, "user not found");
      if (rows[0].Status === "Inactive")
        return unauthorized(res, "user is not active");
      if (rows[0].Status === "Expired")
        return unauthorized(res, "user has expired");
      const record = rows[0];
      const match = await bcrypt.compare(password, record.PasswordHash || "");
      if (!match) return unauthorized(res, "Invalid credentials");

      user = record;
      role = "Patient";
      name = record.fullname;
    } else {
      // Map frontend userType string → DB designation
      const designationMap = {
        doctor: "Doctor",
        nurse: "Nurse",
        pharmacist: "Registrar", // Pharmacist is stored as Registrar in DB
        driver: "Driver",
        admin: "Admin",
      };

      const designation = designationMap[userType];
      if (!designation) return badRequest(res, "Invalid userType");

      const [rows] = await db.query(
        `SELECT * FROM employee WHERE employee_id = ? AND designation = ? AND is_active = 1`,
        [identifier, designation],
      );

      if (rows.length === 0) return unauthorized(res, "Invalid credentials");

      const record = rows[0];
      const match = await bcrypt.compare(password, record.password_hash || "");
      if (!match) return unauthorized(res, "Invalid credentials");

      user = record;
      role = designation;
      name = record.fullname;
    }

    // Issue JWT
    const payload = {
      id: userType === "patient" ? user.CardID : user.employee_id,
      role,
      name,
    };

    const token = sign(payload);

    return ok(
      res,
      {
        token,
        user: {
          id: payload.id,
          role,
          name,
          type: role, // alias kept for frontend compatibility
        },
      },
      "Login successful",
    );
  } catch (err) {
    serverError(res, err, "auth.login");
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user from the JWT
 */
const getMe = async (req, res) => {
  try {
    const { id, role } = req.user;
    let userData = null;

    if (role === "Patient") {
      const [rows] = await db.query(
        `SELECT mc.CardID, mc.Status, mc.BloodGroup, mc.IssueDate, mc.ExpiryDate,
                p.fullname, p.contact_number, p.email, p.type
         FROM MedicalCard mc
         JOIN Person p ON mc.PersonID = p.person_id
         WHERE mc.CardID = ?`,
        [id],
      );
      userData = rows[0] || null;
    } else {
      const [rows] = await db.query(
        `SELECT employee_id, fullname, designation, specialization, contact_no, photo_url, is_active
         FROM employee WHERE employee_id = ?`,
        [id],
      );
      userData = rows[0] || null;
    }

    if (!userData)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return ok(res, { user: { ...userData, role, type: role } });
  } catch (err) {
    serverError(res, err, "auth.getMe");
  }
};

module.exports = { login, getMe };

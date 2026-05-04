const db = require("../../config/db");
const bcrypt = require("bcrypt");
const { ok, badRequest, serverError } = require("../../utils/response");

// GET /profile/me
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT employee_id, fullname, designation, specialization,
              license_no, contact_no, photo_url, is_active
       FROM employee WHERE employee_id = ?`,
      [req.user.id],
    );
    if (!rows.length) return badRequest(res, "Employee not found");
    return ok(res, { data: rows[0] });
  } catch (err) {
    serverError(res, err, "profile.getProfile");
  }
};

// PUT /profile/me
const updateProfile = async (req, res) => {
  try {
    const { fullname, contact_no, specialization, license_no, photo_url } = req.body;
    await db.query(
      `UPDATE employee
       SET fullname = ?, contact_no = ?, specialization = ?, license_no = ?, photo_url = ?
       WHERE employee_id = ?`,
      [fullname, contact_no, specialization || null, license_no || null, photo_url || null, req.user.id],
    );
    return ok(res, {}, "Profile updated");
  } catch (err) {
    serverError(res, err, "profile.updateProfile");
  }
};

// PATCH /profile/me/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return badRequest(res, "Both current and new password are required");
    if (newPassword.length < 6)
      return badRequest(res, "New password must be at least 6 characters");

    const [[emp]] = await db.query(
      "SELECT password_hash FROM employee WHERE employee_id = ?",
      [req.user.id],
    );
    if (!emp) return badRequest(res, "Employee not found");

    const valid = await bcrypt.compare(currentPassword, emp.password_hash);
    if (!valid) return badRequest(res, "Current password is incorrect");

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE employee SET password_hash = ? WHERE employee_id = ?",
      [hash, req.user.id],
    );
    return ok(res, {}, "Password changed successfully");
  } catch (err) {
    serverError(res, err, "profile.changePassword");
  }
};

module.exports = { getProfile, updateProfile, changePassword };
const db = require("../../config/db");
const bcrypt = require("bcrypt");
const {
  ok,
  created,
  notFound,
  serverError,
  badRequest,
} = require("../../utils/response");

// ── Dashboard stats ──────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [[{ totalPatients }]] = await db.query(
      "SELECT COUNT(*) AS totalPatients FROM MedicalCard",
    );
    const [[{ totalEmployees }]] = await db.query(
      "SELECT COUNT(*) AS totalEmployees FROM Employee WHERE is_active = 1",
    );
    const [[{ pendingApplications }]] = await db.query(
      "SELECT COUNT(*) AS pendingApplications FROM MedicalCardApplication WHERE ApplicationStatus = 'Pending'",
    );
    const [[{ todayVisits }]] = await db.query(
      "SELECT COUNT(*) AS todayVisits FROM outdoor_visit WHERE DATE(visit_date) = CURDATE()",
    );

    return ok(res, {
      data: { totalPatients, totalEmployees, pendingApplications, todayVisits },
    });
  } catch (err) {
    serverError(res, err, "admin.getDashboardStats");
  }
};

// ── Employees ────────────────────────────────────────────────
const getEmployees = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT employee_id, fullname, designation, specialization, license_no, contact_no, photo_url, is_active FROM Employee ORDER BY designation, fullname",
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getEmployees");
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const [rows] = await db.query(
      "SELECT employee_id, fullname, designation, specialization, license_no, contact_no, photo_url, is_active FROM Employee WHERE employee_id = ?",
      [employeeId],
    );
    if (!rows.length) return notFound(res, "Employee not found");

    const emp = rows[0];
    let activity = [];

    if (emp.designation === "Doctor") {
      const [[r]] = await db.query(
        "SELECT COUNT(*) AS total FROM outdoor_visit WHERE doctor_id = ?",
        [employeeId],
      );
      activity.push({ type: "Total Visits", count: r.total });
    } else if (emp.designation === "Driver") {
      const [[r]] = await db.query(
        "SELECT COUNT(*) AS total FROM ambulance_log WHERE driver_id = ?",
        [employeeId],
      );
      activity.push({ type: "Total Trips", count: r.total });
    } else if (emp.designation === "Nurse") {
      const [[r]] = await db.query(
        "SELECT COUNT(*) AS total FROM medicine_dispensation WHERE dispensed_by = ?",
        [employeeId],
      );
      activity.push({ type: "Total Dispensations", count: r.total });
    }

    return ok(res, { data: { ...emp, activity } });
  } catch (err) {
    serverError(res, err, "admin.getEmployeeById");
  }
};

// ── Medical Card Applications ────────────────────────────────
const getApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mca.*, p.fullname, p.contact_number, p.type,
              rv.fullname AS reviewer_name, ap.fullname AS approver_name
       FROM MedicalCardApplication mca
       JOIN Person p   ON mca.PersonID   = p.person_id
       LEFT JOIN Employee rv ON mca.ReviewerId = rv.employee_id
       LEFT JOIN Employee ap ON mca.ApprovedBy = ap.employee_id
       ORDER BY mca.ApplicationDate DESC`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getApplications");
  }
};

const reviewApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, comments } = req.body;
    const reviewerId = req.user.id;

    const validStatuses = ["Pending", "Approved", "Rejected"];
    if (!validStatuses.includes(status))
      return badRequest(res, "Invalid status");

    await db.query(
      `UPDATE MedicalCardApplication
       SET ApplicationStatus = ?, ReviewerId = ?, ReviewerComments = ?, ReviewDate = NOW()
       WHERE ApplicationID = ?`,
      [status, reviewerId, comments || null, applicationId],
    );
    if (status === "Approved")
      await db.query(
        "UPDATE MedicalCard SET Status = 'Active' WHERE CardID = (SELECT PersonID FROM MedicalCardApplication WHERE ApplicationID = ?)",
        [applicationId],
      );
    return ok(res, {}, "Application reviewed");
  } catch (err) {
    serverError(res, err, "admin.reviewApplication");
  }
};

const approveMedicalCard = async (req, res) => {
  try {
    const approvedBy = req.user.id;
    await db.query(
      `UPDATE MedicalCardApplication
       SET ApplicationStatus = 'Approved', ApprovedBy = ?, ApprovedDate = NOW()
       WHERE ApplicationID = ?`,
      [approvedBy, applicationId],
    );

    await db.query(
      `INSERT INTO MedicalCard (CardID, IssueDate, ExpiryDate, Status, PersonID, Height_cm, Weight_kg, BloodGroup, PasswordHash)
       VALUES (?, ?, ?, 'Active', ?, ?, ?, ?, ?)`,
      [
        cardId,
        issueDate,
        expiryDate,
        personId,
        height || null,
        weight || null,
        bloodGroup || null,
        passwordHash,
      ],
    );

    return created(res, { data: { cardId } }, "Medical card created");
  } catch (err) {
    serverError(res, err, "admin.approveMedicalCard");
  }
};

// ── Roster ───────────────────────────────────────────────────
const getRosters = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*,
              e.fullname  AS employee_name, e.designation,
              cr.fullname AS created_by_name,
              ap.fullname AS approved_by_name
       FROM roster r
       JOIN Employee e  ON r.employee_id = e.employee_id
       LEFT JOIN Employee cr ON r.created_by  = cr.employee_id
       LEFT JOIN Employee ap ON r.approved_by = ap.employee_id
       ORDER BY r.start_date DESC`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getRosters");
  }
};

const createRoster = async (req, res) => {
  try {
    const { employeeId, dutyType, startDate, endDate, shiftStart, shiftEnd } =
      req.body;
    const createdBy = req.user.id;

    const [result] = await db.query(
      `INSERT INTO roster (employee_id, duty_type, start_date, end_date, shift_start, shift_end, created_at, created_by, status)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 'Draft')`,
      [
        employeeId,
        dutyType,
        startDate,
        endDate,
        shiftStart || null,
        shiftEnd || null,
        createdBy,
      ],
    );

    return created(
      res,
      { data: { rosterId: result.insertId } },
      "Roster created",
    );
  } catch (err) {
    serverError(res, err, "admin.createRoster");
  }
};

const approveRoster = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const approvedBy = req.user.id;

    await db.query(
      "UPDATE roster SET status = 'Approved', approved_by = ? WHERE roster_id = ?",
      [approvedBy, rosterId],
    );
    return ok(res, {}, "Roster approved");
  } catch (err) {
    serverError(res, err, "admin.approveRoster");
  }
};

const updateRoster = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const { dutyType, startDate, endDate, shiftStart, shiftEnd } = req.body;

    await db.query(
      `UPDATE roster SET duty_type = ?, start_date = ?, end_date = ?, shift_start = ?, shift_end = ?
       WHERE roster_id = ? AND status = 'Draft'`,
      [dutyType, startDate, endDate, shiftStart, shiftEnd, rosterId],
    );
    return ok(res, {}, "Roster updated");
  } catch (err) {
    serverError(res, err, "admin.updateRoster");
  }
};

const deleteRoster = async (req, res) => {
  try {
    const { rosterId } = req.params;
    await db.query(
      "DELETE FROM roster WHERE roster_id = ? AND status = 'Draft'",
      [rosterId],
    );
    return ok(res, {}, "Roster deleted");
  } catch (err) {
    serverError(res, err, "admin.deleteRoster");
  }
};

// ── Patients list ────────────────────────────────────────────
const getPatients = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mc.CardID, mc.IssueDate, mc.ExpiryDate, mc.Status,
              mc.BloodGroup, mc.Height_cm, mc.Weight_kg,
              p.fullname, p.contact_number, p.email, p.type
       FROM MedicalCard mc
       JOIN Person p ON mc.PersonID = p.person_id
       ORDER BY mc.IssueDate DESC`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getPatients");
  }
};

// ── First-aid requests (admin view) ─────────────────────────
const approveFirstAidRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const approvedBy = req.user.id;

    await db.query(
      "UPDATE first_aid_request SET statue = ?, approved_by = ? WHERE request_id = ?",
      [status, approvedBy, requestId],
    );

    if (status === "APPROVED") {
      const [items] = await db.query(
        "SELECT * FROM first_aid_item WHERE request_id = ?",
        [requestId],
      );
      for (const item of items) {
        const [[{ total }]] = await db.query(
          "SELECT COALESCE(SUM(quantity), 0) AS total FROM medicine_inventory WHERE medicine_id = ?",
          [item.medicine_id],
        );
        await db.query(
          `INSERT INTO medicine_transaction (medicine_id, transaction_type, quantity, made_by, reference_type, reference, balance_after)
           VALUES (?, 'OUT', ?, ?, 'StudyTour', ?, ?)`,
          [
            item.medicine_id,
            item.quantity,
            approvedBy,
            requestId,
            total - item.quantity,
          ],
        );
      }
    }

    return ok(res, {}, `First aid request ${status.toLowerCase()}`);
  } catch (err) {
    serverError(res, err, "admin.approveFirstAidRequest");
  }
};

module.exports = {
  getDashboardStats,
  getEmployees,
  getEmployeeById,
  getApplications,
  reviewApplication,
  approveMedicalCard,
  getRosters,
  createRoster,
  approveRoster,
  updateRoster,
  deleteRoster,
  getPatients,
  approveFirstAidRequest,
};

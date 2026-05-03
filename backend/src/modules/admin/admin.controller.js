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
      "SELECT COUNT(*) AS totalEmployees FROM employee WHERE is_active = 1",
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
      "SELECT employee_id, fullname, designation, specialization, license_no, contact_no, photo_url, is_active FROM employee ORDER BY designation, fullname",
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
      "SELECT employee_id, fullname, designation, specialization, license_no, contact_no, photo_url, is_active FROM employee WHERE employee_id = ?",
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
// (POST /admin/employees) — create a new employee (Admin only)
// ── Medical Card Applications ────────────────────────────────
const getApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mca.*, 
              p.person_id, p.fullname, p.date_of_birth, p.contact_number, p.email,
              p.upazilla, p.district, p.division, p.country, p.type,
              mc.Height_cm, mc.Weight_kg, mc.BloodGroup
       FROM MedicalCardApplication mca
       JOIN Person p ON mca.PersonID = p.person_id
       LEFT JOIN MedicalCard mc ON p.person_id = mc.PersonID
       where mca.ApplicationStatus = 'Pending'
       ORDER BY mca.ApplicationDate DESC`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getApplications");
  }
};

// GET /admin/applications/:applicationId — get details of a specific medical card application (including applicant info and application status/history)
const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const [rows] = await db.query(
      `SELECT mca.*, p.fullname, p.contact_number, p.type
       FROM MedicalCardApplication mca
       JOIN Person p ON mca.PersonID = p.person_id
       WHERE mca.ApplicationID = ?`,
      [applicationId],
    );

    if (!rows.length) return notFound(res, "Application not found");

    return ok(res, { data: rows[0] });
  } catch (err) {
    serverError(res, err, "admin.getApplicationById");
  }
};

// POST /admin/applications/approve — approve a medical card application (also creates the actual medical card if approved)
const approveMedicalCard = async (req, res) => {
  try {
    const {applicationId, status, comments } = req.body;
    const reviewerId = req.user.id;
    console.log("Approving application", applicationId, "with status", status, "by reviewer", reviewerId);
    const validStatuses = ["Pending", "Approved", "Rejected"];
    if (!validStatuses.includes(status))
      return badRequest(res, "Invalid status");

    await db.query(
      `UPDATE MedicalCardApplication
       SET ApplicationStatus = ?, ApprovedBy = ?, ApprovedDate = ?, ReviewerComments = ?
       WHERE ApplicationID = ?`,
      [status, reviewerId, new Date(), comments, applicationId],
    );
    if (status === "Approved")
      await db.query(
        "UPDATE MedicalCard SET Status = 'Active' WHERE CardID = (SELECT PersonID FROM MedicalCardApplication WHERE ApplicationID = ?)",
        [applicationId],
      );
    return ok(res, {}, "Application approved");
  } catch (err) {
    serverError(res, err, "admin.approveMedicalCard");
  }
};

// GET /admin/cards — list all issued medical cards with basic info (card ID, holder name, issue/expiry date, status)
const getCards = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mc.*, p.fullname, p.contact_number
       FROM MedicalCard mc
       JOIN Person p ON mc.PersonID = p.person_id
       ORDER BY mc.IssueDate DESC`,
    );

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getCards");
  }
};

// PATCH /admin/cards/:cardId/status — update the status of a medical card (e.g. mark as expired, suspended, etc.)
const updateCardStatus = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { status } = req.body;

    await db.query("UPDATE MedicalCard SET Status = ? WHERE CardID = ?", [
      status,
      cardId,
    ]);

    return ok(res, {}, "Card status updated");
  } catch (err) {
    serverError(res, err, "admin.updateCardStatus");
  }
};

// PATCH /admin/cards/:cardId/extend — extend the expiry date of a medical card (e.g. by 1 year)
const extendCardExpiry = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { newExpiryDate } = req.body;

    await db.query("UPDATE MedicalCard SET ExpiryDate = ? WHERE CardID = ?", [
      newExpiryDate,
      cardId,
    ]);

    return ok(res, {}, "Card expiry updated");
  } catch (err) {
    serverError(res, err, "admin.extendCardExpiry");
  }
};

// const approveMedicalCard = async (req, res) => {
//   try {
//     const approvedBy = req.user.id;
//     await db.query(
//       `UPDATE MedicalCardApplication
//        SET ApplicationStatus = 'Approved', ApprovedBy = ?, ApprovedDate = NOW()
//        WHERE ApplicationID = ?`,
//       [approvedBy, applicationId],
//     );

//     await db.query(
//       `INSERT INTO MedicalCard (CardID, IssueDate, ExpiryDate, Status, PersonID, Height_cm, Weight_kg, BloodGroup, PasswordHash)
//        VALUES (?, ?, ?, 'Active', ?, ?, ?, ?, ?)`,
//       [
//         cardId,
//         issueDate,
//         expiryDate,
//         personId,
//         height || null,
//         weight || null,
//         bloodGroup || null,
//         passwordHash,
//       ],
//     );

//     return created(res, { data: { cardId } }, "Medical card created");
//   } catch (err) {
//     serverError(res, err, "admin.approveMedicalCard");
//   }
// };

// (GET /rosters) — retrieve all rosters
const getRosters = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*,
              e.fullname  AS employee_name, e.designation,
              cr.fullname AS created_by_name,
              ap.fullname AS approved_by_name
       FROM roster r
       JOIN employee e  ON r.employee_id = e.employee_id
       LEFT JOIN employee cr ON r.created_by  = cr.employee_id
       LEFT JOIN employee ap ON r.approved_by = ap.employee_id
       ORDER BY r.start_date DESC`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getRosters");
  }
};

// (POST /rosters) — only allow creating rosters for active employees, and default status to Draft
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

//(PATCH /rosters/:rosterId/publish) — only allow publishing if currently in Draft status
const publishRoster = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const approvedBy = req.user.id;

    await db.query(
      "UPDATE roster SET status = 'Approved', approved_by = ? WHERE roster_id = ?",
      [approvedBy, rosterId],
    );
    return ok(res, {}, "Roster approved");
  } catch (err) {
    serverError(res, err, "admin.publishRoster");
  }
};

// Only allow updating rosters that are still in Draft status (/rosters/:rosterId )
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

// Only allow deleting rosters that are still in Draft status
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

// ── Patients list (/patients) ─────────────────────────────────────────────
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

// GET /admin/first-aid-requests — view all first-aid requests with details (for admin use)
const getFirstAidRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT far.*, p.fullname
       FROM first_aid_request far
       JOIN MedicalCard mc ON far.requested_by = mc.CardID
       JOIN Person p ON mc.PersonID = p.person_id
       ORDER BY far.request_date DESC`,
    );

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getFirstAidRequests");
  }
};

// GET /admin/first-aid/:requestId — view details of a specific first-aid request (including requested items, patient info, etc.)
const getFirstAidRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const [request] = await db.query(
      `SELECT far.*, p.fullname
       FROM first_aid_request far
       JOIN MedicalCard mc ON far.requested_by = mc.CardID
       JOIN Person p ON mc.PersonID = p.person_id
       WHERE far.request_id = ?`,
      [requestId],
    );

    if (!request.length) return notFound(res, "Request not found");

    const [items] = await db.query(
      `SELECT fai.*, m.name
       FROM first_aid_item fai
       JOIN medicine m ON fai.medicine_id = m.medicine_id
       WHERE fai.request_id = ?`,
      [requestId],
    );

    return ok(res, {
      data: { ...request[0], items },
    });
  } catch (err) {
    serverError(res, err, "admin.getFirstAidRequestById");
  }
};

// ── First-aid requests (admin view) /first-aid/:requestId ─────────────────────────
const approveFirstAidRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const approvedBy = req.user.id;

    await db.query(
      "UPDATE first_aid_request SET statue = ?, approved_by = ? WHERE request_id = ?",
      [status, approvedBy, requestId],
    );

    // if (status === "APPROVED") {
    //   const [items] = await db.query(
    //     "SELECT * FROM first_aid_item WHERE request_id = ?",
    //     [requestId],
    //   );
    //   for (const item of items) {
    //     const [[{ total }]] = await db.query(
    //       "SELECT COALESCE(SUM(quantity), 0) AS total FROM medicine_inventory WHERE medicine_id = ?",
    //       [item.medicine_id],
    //     );
    //     await db.query(
    //       `INSERT INTO medicine_transaction (medicine_id, transaction_type, quantity, made_by, reference_type, reference, balance_after)
    //        VALUES (?, 'OUT', ?, ?, 'StudyTour', ?, ?)`,
    //       [
    //         item.medicine_id,
    //         item.quantity,
    //         approvedBy,
    //         requestId,
    //         total - item.quantity,
    //       ],
    //     );
    //   }
    // }

    return ok(res, {}, `First aid request ${status.toLowerCase()}`);
  } catch (err) {
    serverError(res, err, "admin.approveFirstAidRequest");
  }
};

// helper → generate employee ID

const generateEmployeeId = async (designation) => {
  let prefix = "EMP";

  switch (designation) {
    case "Doctor":
      prefix = "DOC";

      break;

    case "Nurse":
      prefix = "NUR";

      break;

    case "Driver":
      prefix = "DRV";

      break;

    case "Admin":
      prefix = "ADM";

      break;

    case "Registrar":
      prefix = "REG";

      break;
  }

  const [[{ count }]] = await db.query(
    "SELECT COUNT(*) AS count FROM employee WHERE designation = ?",

    [designation],
  );

  const number = String(count + 1).padStart(3, "0"); // DOC001

  return `${prefix}${number}`;
};

// ── Create Employee ─────────────────────────────────────────

const createEmployee = async (req, res) => {
  try {
    const {
      fullname,

      designation,

      specialization,

      license_no,

      contact_no,

      password,

      photo_url,
    } = req.body;

    // validation

    if (!fullname || !designation || !contact_no || !password) {
      return badRequest(res, "Missing required fields");
    }

    const validDesignations = [
      "Doctor",

      "Nurse",

      "Registrar",

      "Driver",

      "Admin",
    ];

    if (!validDesignations.includes(designation)) {
      return badRequest(res, "Invalid designation");
    }

    // generate employee id

    const employeeId = await generateEmployeeId(designation);

    // hash password

    const saltRounds = 10;

    const passwordHash = await bcrypt.hash(password, saltRounds);

    // insert into DB

    await db.query(
      `INSERT INTO employee 

        (employee_id, fullname, designation, specialization, license_no, photo_url, contact_no, is_active, password_hash)

       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,

      [
        employeeId,

        fullname,

        designation,

        specialization || null,

        license_no || null,

        photo_url || null,

        contact_no,

        passwordHash,
      ],
    );

    return created(
      res,

      { data: { employee_id: employeeId } },

      "Employee created successfully",
    );
  } catch (err) {
    serverError(res, err, "admin.createEmployee");
  }
};

// PUT /admin/employees/:employeeId — update employee details (except password)
const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const {
      fullname,

      designation,

      specialization,

      license_no,

      contact_no,

      photo_url,
    } = req.body;

    const [result] = await db.query(
      `UPDATE employee 

       SET fullname = ?, designation = ?, specialization = ?, 

           license_no = ?, contact_no = ?, photo_url = ?

       WHERE employee_id = ?`,

      [
        fullname,

        designation,

        specialization || null,

        license_no || null,

        contact_no,

        photo_url || null,

        employeeId,
      ],
    );

    if (!result.affectedRows) return notFound(res, "Employee not found");

    return ok(res, {}, "Employee updated");
  } catch (err) {
    serverError(res, err, "admin.updateEmployee");
  }
};

// PATCH /admin/employees/:employeeId/status — activate/deactivate employee
const updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { is_active } = req.body;

    await db.query("UPDATE employee SET is_active = ? WHERE employee_id = ?", [
      is_active ? 1 : 0,
      employeeId,
    ]);

    return ok(res, {}, "Employee status updated");
  } catch (err) {
    serverError(res, err, "admin.updateEmployeeStatus");
  }
};

// PATCH /admin/employees/:employeeId/reset-password — reset employee password to a default value (e.g. "password123")
const resetEmployeePassword = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE employee SET password_hash = ? WHERE employee_id = ?",
      [hash, employeeId],
    );

    return ok(res, {}, "Password reset successful");
  } catch (err) {
    serverError(res, err, "admin.resetEmployeePassword");
  }
};

//GET /admin/inventory — view current medicine inventory levels (for admin use)
const getInventory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.name, m.generic_name,
              SUM(mi.quantity) AS total_quantity,
              MIN(mi.exp_date) AS nearest_expiry
       FROM medicine_inventory mi
       JOIN medicine m ON mi.medicine_id = m.medicine_id
       GROUP BY mi.medicine_id`,
    );

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getInventory");
  }
};

// GET /admin/transactions — view all medicine transactions (for admin use)
const getTransactions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mt.*, m.name, e.fullname AS employee_name
       FROM medicine_transaction mt
       JOIN medicine m ON mt.medicine_id = m.medicine_id
       JOIN employee e ON mt.made_by = e.employee_id
       ORDER BY mt.transaction_date DESC`,
    );

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getTransactions");
  }
};

// GET /admin/ambulance-logs — view all ambulance usage logs (for admin use)
const getAmbulanceLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT al.*, p.fullname AS patient_name, e.fullname AS driver_name
       FROM ambulance_log al
       JOIN MedicalCard mc ON al.patient_id = mc.CardID
       JOIN Person p ON mc.PersonID = p.person_id
       JOIN employee e ON al.driver_id = e.employee_id
       ORDER BY al.departure_time DESC`,
    );

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "admin.getAmbulanceLogs");
  }
};

module.exports = {
  getDashboardStats,
  getEmployees,
  getEmployeeById,
  getApplications,
  //reviewApplication,
  approveMedicalCard,
  getRosters,
  createRoster,
  publishRoster,
  updateRoster,
  deleteRoster,
  getPatients,
  approveFirstAidRequest,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  resetEmployeePassword,
  getInventory,
  getTransactions,
  getAmbulanceLogs,
  getApplicationById,
  getCards,
  updateCardStatus,
  extendCardExpiry,
  getFirstAidRequests,
  getFirstAidRequestById,
};

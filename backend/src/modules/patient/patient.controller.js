const { v4: uuidv4 } = require('uuid');
const db = require("../../config/db");
const bcrypt = require("bcrypt");
const {
  ok,
  created,
  notFound,
  serverError,
  badRequest,
} = require("../../utils/response");

// GET /api/patient/:patientId/profile
const getProfile = async (req, res) => {
  try {
    const cardId = req.params.patientId || req.user.id;

    const [rows] = await db.query(
      `SELECT mc.CardID, mc.IssueDate, mc.ExpiryDate, mc.Status,
              mc.Height_cm, mc.Weight_kg, mc.BloodGroup,
              p.fullname, p.contact_number, p.email, p.type,
              p.upazilla, p.district, p.division, p.country, p.date_of_birth
       FROM MedicalCard mc
       JOIN Person p ON mc.PersonID = p.person_id
       WHERE mc.CardID = ?`,
      [cardId],
    );
    if (!rows.length) return notFound(res, "Patient not found");
    return ok(res, { data: rows[0] });
  } catch (err) {
    serverError(res, err, "patient.getProfile");
  }
};

// GET /api/patient/:patientId/visits
const getVisits = async (req, res) => {
  try {
    const cardId = req.params.patientId || req.user.id;

    const [rows] = await db.query(
      `SELECT ov.visit_id, ov.visit_date,
              e.fullname AS doctor_name,
              pr.symptoms, pr.advice
       FROM outdoor_visit ov
       LEFT JOIN Employee e    ON ov.doctor_id  = e.employee_id
       LEFT JOIN prescription pr ON ov.visit_id = pr.visit_id
       WHERE ov.card_id = ?
       ORDER BY ov.visit_date DESC`,
      [cardId],
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "patient.getVisits");
  }
};

// POST /api/patient/apply  —  submit a new medical card application
const applyForMedicalCard = async (req, res) => {
  try {
    const {
      personId,
      fullname,
      dateOfBirth,
      height,
      weight,
      bloodgroup,
      contactNumber,
      email,
      upazilla,
      district,
      division,
      country,
      type,
      photoUrl,
      idCardUrl,
      password,
    } = req.body;

    if (!personId || !fullname || !contactNumber || !type || !password) {
      return badRequest(
        res,
        "personId, fullname, contactNumber, type and password are required",
      );
    }

    const passwordhash = await bcrypt.hash(password, 10);

    // Upsert person
    await db.query(
      `INSERT INTO Person (person_id, fullname, date_of_birth, contact_number, email, upazilla, district, division, country, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         fullname = VALUES(fullname),
         contact_number = VALUES(contact_number),
         email = VALUES(email)`,
      [
        personId,
        fullname,
        dateOfBirth || null,
        contactNumber,
        email || null,
        upazilla || null,
        district || null,
        division || null,
        country || "Bangladesh",
        type,
      ],
    );
    await db.query(
      `INSERT INTO MedicalCard (CardID, IssueDate, ExpiryDate, Status, PersonID, Height_cm, Weight_kg, BloodGroup, PasswordHash)
       VALUES (?, now(), DATE_ADD(now(), INTERVAL 4 YEAR), 'Inactive', ?,?, ?, ?, ?)`,
      [personId, personId, height, weight, bloodgroup, passwordhash],
    );
    const [result] = await db.query(
      `INSERT INTO MedicalCardApplication
         (ApplicationDate, ApplicationStatus, PhotoUrl, IdCardUrl, PersonID)
       VALUES (NOW(), 'Pending', ?, ?, ?)`,
      [photoUrl || null, idCardUrl || null, personId],
    );

    return created(
      res,
      { data: { applicationId: result.insertId } },
      "Application submitted",
    );
  } catch (err) {
    serverError(res, err, "patient.applyForMedicalCard");
  }
};

// GET /api/patient/:patientId/first-aid
const getFirstAidRequests = async (req, res) => {
  try {
    const cardId = req.params.patientId || req.user.id;

    const [rows] = await db.query(
      `SELECT far.*, e.fullname AS approved_by_name
       FROM first_aid_request far
       LEFT JOIN employee e ON far.approved_by = e.employee_id
       WHERE far.requested_by = ?
       ORDER BY far.request_date DESC`,
      [cardId],
    );


    for (const req of rows) {
      const [items] = await db.query(
        `SELECT fai.*, m.name AS medicine_name
         FROM first_aid_item fai
         JOIN medicine m ON fai.medicine_id = m.medicine_id
         WHERE fai.request_id = ?`,
        [req.request_id],
      );
      req.items = items;
    }

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "patient.getFirstAidRequests");
  }
};

// POST /api/patient/first-aid
const createFirstAidRequest = async (req, res) => {
  try {
    const cardId = req.user.id;
    const { tripDetails, documentUrl, items } = req.body;

    if (!tripDetails) return badRequest(res, "tripDetails is required"); 

    const requestId = uuidv4().replace(/-/g, '').slice(0, 15);

    //const [result] = 
    await db.query(
      `INSERT INTO first_aid_request (request_id, requested_by, trip_details, document_url, request_date, statue)
       VALUES (?, ?, ?, ?, CURDATE(), 'PENDING')`,
      [requestId, cardId, tripDetails, documentUrl || null],
    );

    //const requestId = result.insertId;

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await db.query(
          "INSERT INTO first_aid_item (request_id, medicine_id, quantity) VALUES (?, ?, ?)",
          [requestId, item.medicineId, item.quantity],
        );
      }
    }

    return created(res, { data: { requestId } }, "First aid request submitted");
  } catch (err) {
    serverError(res, err, "patient.createFirstAidRequest");
  }
};

module.exports = {
  getProfile,
  getVisits,
  applyForMedicalCard,
  getFirstAidRequests,
  createFirstAidRequest,
};

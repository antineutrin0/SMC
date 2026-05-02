const db = require("../../config/db");
const { ok, created, notFound, serverError, badRequest } = require("../../utils/response");

// GET /api/doctor/:doctorId/visits
const getVisits = async (req, res) => {
  try {
    const doctorId = req.params.doctorId || req.user.id;

    const [rows] = await db.query(
      `SELECT ov.visit_id, ov.card_id, ov.visit_date,
              p.fullname  AS patient_name,
              pr.prescription_id, pr.symptoms, pr.advice, pr.hastoken
       FROM outdoor_visit ov
       JOIN MedicalCard mc ON ov.card_id = mc.CardID
       JOIN Person p        ON mc.PersonID = p.person_id
       LEFT JOIN prescription pr ON ov.visit_id = pr.visit_id
       WHERE ov.doctor_id = ?
       ORDER BY ov.visit_date DESC`,
      [doctorId]
    );
    return ok(res, { data: rows });
  } catch (err) { serverError(res, err, "doctor.getVisits"); }
};

// POST /api/doctor/visits
const createVisit = async (req, res) => {
  try {
    const { cardId } = req.body;
    const doctorId   = req.user.id;

    // Verify card exists and is active
    const [cardRows] = await db.query(
      "SELECT CardID FROM MedicalCard WHERE CardID = ? AND Status = 'Active'",
      [cardId]
    );
    if (!cardRows.length) return notFound(res, "Active medical card not found");

    const [result] = await db.query(
      "INSERT INTO outdoor_visit (card_id, doctor_id, visit_date) VALUES (?, ?, NOW())",
      [cardId, doctorId]
    );

    return created(res, { data: { visitId: result.insertId } }, "Visit created");
  } catch (err) { serverError(res, err, "doctor.createVisit"); }
};

// POST /api/doctor/prescriptions
const createPrescription = async (req, res) => {
  try {
    const { visitId, symptoms, advice, medications } = req.body;

    if (!symptoms) return badRequest(res, "symptoms is required");

    // Ensure visit exists and belongs to this doctor
    const [visitRows] = await db.query(
      "SELECT visit_id FROM outdoor_visit WHERE visit_id = ? AND doctor_id = ?",
      [visitId, req.user.id]
    );
    if (!visitRows.length) return notFound(res, "Visit not found or not yours");

    const [prescResult] = await db.query(
      "INSERT INTO prescription (visit_id, symptoms, advice, created_at) VALUES (?, ?, ?, NOW())",
      [visitId, symptoms, advice || null]
    );

    const prescriptionId = prescResult.insertId;

    if (Array.isArray(medications) && medications.length > 0) {
      for (const med of medications) {
        await db.query(
          `INSERT INTO medication (prescription_id, medicine_id, dosage_amount, dosage_unit, duration_day, frequency)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [prescriptionId, med.medicineId, med.dosageAmount, med.dosageUnit, med.durationDay, med.frequency]
        );
      }
    }

    // Auto-generate medicine collection token
    await db.query(
      "INSERT INTO token (visit_id, issued_time) VALUES (?, NOW())",
      [visitId]
    );

    return created(res, { data: { prescriptionId } }, "Prescription created");
  } catch (err) { serverError(res, err, "doctor.createPrescription"); }
};

const createToken = async (req, res) => {
  try {
    const { visitId, medications } = req.body;

    // Ensure visit exists and belongs to this doctor
    const [visitRows] = await db.query(
      "SELECT visit_id FROM outdoor_visit WHERE visit_id = ? AND doctor_id = ?",
      [visitId, req.user.id]
    );
    if (!visitRows.length) return notFound(res, "Visit not found or not yours");

    // Create token
    const [tokenResult] = await db.query(
      "INSERT INTO token (visit_id, issued_time) VALUES (?, NOW())",
      [visitId]
    );

    await db.query(
      `UPDATE prescription SET hastoken = 1 WHERE visit_id = ?`,
      [visitId]
    );  

    // create token items
    if (Array.isArray(medications) && medications.length > 0) {
      for (const med of medications) {
        await db.query(
          `INSERT INTO token_item (token_id, medicine_id, quantity)
           VALUES (?, ?, ?)`,
          [tokenResult.insertId, med.medicineId, med.quantity]
        );
      }
    }

    return created(res, {}, "Token created");
  } catch (err) { serverError(res, err, "doctor.createToken"); }
};


// GET /api/doctor/prescriptions/:visitId
const getPrescription = async (req, res) => {
  try {
    const { visitId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM prescription WHERE visit_id = ?",
      [visitId]
    );
    if (!rows.length) return notFound(res, "Prescription not found");

    const [meds] = await db.query(
      `SELECT med.*, m.name AS medicine_name, m.generic_name
       FROM medication med
       JOIN medicine m ON med.medicine_id = m.medicine_id
       WHERE med.prescription_id = ?`,
      [rows[0].prescription_id]
    );

    return ok(res, { data: { ...rows[0], medications: meds } });
  } catch (err) { serverError(res, err, "doctor.getPrescription"); }
};

// GET /api/doctor/medicines
const getMedicines = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.medicine_id, m.name, m.generic_name, m.catagory,
              COALESCE(SUM(mi.quantity), 0) AS total_quantity,
              MIN(mi.exp_date)              AS nearest_expiry
       FROM medicine m
       LEFT JOIN medicine_inventory mi ON m.medicine_id = mi.medicine_id
       GROUP BY m.medicine_id
       ORDER BY m.name`
    );
    return ok(res, { data: rows });
  } catch (err) { serverError(res, err, "doctor.getMedicines"); }
};

module.exports = { getVisits, createVisit, createPrescription, getPrescription, getMedicines, createToken };

const db = require("../../config/db");
const {
  ok,
  notFound,
  serverError,
  badRequest,
} = require("../../utils/response");

// GET /api/nurse/tokens/pending
const getPendingTokens = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.token_id, t.issued_time,
              ov.card_id, ov.visit_id, ov.visit_date,
              p.fullname AS patient_name,
              pr.prescription_id, pr.symptoms
       FROM token t
       JOIN outdoor_visit ov  ON t.visit_id = ov.visit_id
       JOIN MedicalCard mc    ON ov.card_id = mc.CardID
       JOIN Person p          ON mc.PersonID = p.person_id
       LEFT JOIN prescription pr ON ov.visit_id = pr.visit_id
       WHERE t.token_id NOT IN (
         SELECT DISTINCT token_id FROM medicine_dispensation
       )
       ORDER BY t.issued_time ASC`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "nurse.getPendingTokens");
  }
};

// GET /api/nurse/prescription/:visitId
const getPrescription = async (req, res) => {
  try {
    const { visitId } = req.params;

    const [rows] = await db.query(
      `SELECT pr.prescription_id, pr.symptoms, pr.advice, pr.created_at,
              ov.card_id, ov.visit_date,
              p.fullname  AS patient_name,
              e.fullname AS doctor_name
       FROM prescription pr
       JOIN outdoor_visit ov ON pr.visit_id = ov.visit_id
       JOIN MedicalCard mc   ON ov.card_id  = mc.CardID
       JOIN Person p         ON mc.PersonID = p.person_id
       JOIN employee e       ON ov.doctor_id = e.employee_id
       WHERE pr.visit_id = ?`,
      [visitId],
    );
    if (!rows.length) return notFound(res, "Prescription not found");

    const [meds] = await db.query(
      `SELECT med.medicine_id, med.dosage_amount, med.dosage_unit,
              med.duration_day, med.frequency,
              m.name AS medicine_name, m.generic_name,
              COALESCE(SUM(mi.quantity), 0) AS available_quantity
       FROM medication med
       JOIN medicine m ON med.medicine_id = m.medicine_id
       LEFT JOIN medicine_inventory mi ON m.medicine_id = mi.medicine_id
       WHERE med.prescription_id = ?
       GROUP BY med.medicine_id`,
      [rows[0].prescription_id],
    );

    return ok(res, { data: { ...rows[0], medications: meds } });
  } catch (err) {
    serverError(res, err, "nurse.getPrescription");
  }
};

// POST /api/nurse/dispense
const dispenseMedicine = async (req, res) => {
  try {
    const { tokenId, medicines } = req.body;
    const employeeId = req.user.id;

    if (!tokenId || !Array.isArray(medicines) || !medicines.length) {
      return badRequest(res, "tokenId and medicines[] are required");
    }

    for (const med of medicines) {
      if (!med.quantity || med.quantity <= 0) continue;

      // Record dispensation
      await db.query(
        `INSERT INTO medicine_dispensation (token_id, medicine_id, quantity_dispensed, dispensed_by, dispensed_time)
         VALUES (?, ?, ?, ?, NOW())`,
        [tokenId, med.medicineId, med.quantity, employeeId],
      );

      // Deduct from inventory (FIFO by expiry)
      await db.query(
        `UPDATE medicine_inventory
         SET quantity = quantity - ?
         WHERE medicine_id = ? AND quantity > 0
         ORDER BY exp_date ASC
         LIMIT 1`,
        [med.quantity, med.medicineId],
      );

      // Record transaction
      const [[{ total }]] = await db.query(
        "SELECT COALESCE(SUM(quantity), 0) AS total FROM medicine_inventory WHERE medicine_id = ?",
        [med.medicineId],
      );

      await db.query(
        `INSERT INTO medicine_transaction (medicine_id, transaction_type, quantity, made_by, reference_type, reference_id, balance_after)
         VALUES (?, 'OUT', ?, ?, 'Substore', ?, ?)`,
        [med.medicineId, med.quantity, employeeId, String(tokenId), total],
      );
    }

    return ok(res, {}, "Medicine dispensed successfully");
  } catch (err) {
    serverError(res, err, "nurse.dispenseMedicine");
  }
};

// GET /api/nurse/:nurseId/history
const getDispensationHistory = async (req, res) => {
  try {
    const nurseId = req.params.nurseId || req.user.id;

    const [rows] = await db.query(
      `SELECT md.token_id, md.quantity_dispensed, md.dispensed_time,
              m.name AS medicine_name,
              p.fullname AS patient_name, ov.card_id
       FROM medicine_dispensation md
       JOIN medicine m     ON md.medicine_id = m.medicine_id
       JOIN token t        ON md.token_id    = t.token_id
       JOIN outdoor_visit ov ON t.visit_id   = ov.visit_id
       JOIN MedicalCard mc ON ov.card_id     = mc.CardID
       JOIN Person p       ON mc.PersonID    = p.person_id
       WHERE md.dispensed_by = ?
       ORDER BY md.dispensed_time DESC
       LIMIT 100`,
      [nurseId],
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "nurse.getDispensationHistory");
  }
};

module.exports = {
  getPendingTokens,
  getPrescription,
  dispenseMedicine,
  getDispensationHistory,
};

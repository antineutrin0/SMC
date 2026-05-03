const db = require("../../config/db");
const {
  ok,
  notFound,
  serverError,
  badRequest,
} = require("../../utils/response");
const { get } = require("./nurse.routes");

// GET /api/nurse/tokens/pending
/*
[
  {
    "token_id": 10,
    "token_uuid": "ABC123",
    "patient_name": "Fahim Rahman",
    "doctor_name": "Dr. Arafat Hossain",
    "issued_time": "2024-12-10T14:11:00.000Z",
    "items": [
      {
        "medicine_id": 28,
        "medicine_name": "Sultolin SR",
        "quantity": 2
      }
    ]
  }
]*/
const getPendingTokens = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.token_id,
        t.token_uuid,
        t.issued_time,
        t.status,

        p.fullname AS patient_name,
        d.fullname AS doctor_name,

        ov.card_id,
        ov.visit_id,
        ov.visit_date,

        ti.medicine_id,
        m.name AS medicine_name,
        ti.quantity

      FROM token t
      JOIN outdoor_visit ov   ON t.visit_id = ov.visit_id
      JOIN MedicalCard mc     ON ov.card_id = mc.CardID
      JOIN Person p           ON mc.PersonID = p.person_id
      JOIN employee d         ON ov.doctor_id = d.employee_id

      LEFT JOIN token_item ti ON t.token_id = ti.token_id
      LEFT JOIN medicine m    ON ti.medicine_id = m.medicine_id

      WHERE t.status = 'Pending'
      ORDER BY t.issued_time DESC
    `);
    const tokensMap = new Map();

    for (const row of rows) {
      if (!tokensMap.has(row.token_id)) {
        tokensMap.set(row.token_id, {
          token_id: row.token_id,
          token_uuid: row.token_uuid,
          issued_time: row.issued_time,
          status: row.status,
          patient_name: row.patient_name,
          doctor_name: row.doctor_name,
          card_id: row.card_id,
          visit_id: row.visit_id,
          visit_date: row.visit_date,
          items: [],
        });
      }

      // add item only if exists
      if (row.medicine_id) {
        tokensMap.get(row.token_id).items.push({
          medicine_id: row.medicine_id,
          medicine_name: row.medicine_name,
          quantity: row.quantity,
        });
      }
    }

    const result = Array.from(tokensMap.values());

    return ok(res, { data: result });
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

      // Bug 2 fix — guard against insufficient substore stock
      const [[{ stock }]] = await db.query(
        "SELECT quantity AS stock FROM substore_inventory WHERE medicine_id = ?",
        [med.medicineId],
      );
      if (!stock || stock < med.quantity) {
        return badRequest(
          res,
          `Insufficient stock for medicine ID ${med.medicineId}`,
        );
      }

      // Record dispensation
      await db.query(
        `INSERT INTO medicine_dispensation (token_id, medicine_id, quantity_dispensed, dispensed_by, dispensed_time)
         VALUES (?, ?, ?, ?, NOW())`,
        [tokenId, med.medicineId, med.quantity, employeeId],
      );

      // Deduct from substore inventory
      await db.query(
        "UPDATE substore_inventory SET quantity = quantity - ? WHERE medicine_id = ?",
        [med.quantity, med.medicineId],
      );
    }

    // mark token as Consumed
    await db.query("UPDATE token SET status = 'Consumed' WHERE token_id = ?", [
      tokenId,
    ]);

    return ok(res, {}, "Medicine dispensed successfully");
  } catch (err) {
    serverError(res, err, "nurse.dispenseMedicine");
  }
};

// GET /api/nurse/:nurseId/history
const getDispensationHistory = async (req, res) => {
  const {nurseId}=req.params.nurseId||req.user.id; // allow nurses to view their own history without specifying ID
  try {
    const [rows] = await db.query(`
      SELECT 
        t.token_id,
        t.token_uuid,
        t.issued_time,
        t.status,

        p.fullname AS patient_name,
        d.fullname AS doctor_name,

        ov.card_id,
        ov.visit_id,
        ov.visit_date,

        ti.medicine_id,
        m.name AS medicine_name,
        ti.quantity

      FROM token t
      JOIN outdoor_visit ov   ON t.visit_id = ov.visit_id
      JOIN MedicalCard mc     ON ov.card_id = mc.CardID
      JOIN Person p           ON mc.PersonID = p.person_id
      JOIN employee d         ON ov.doctor_id = d.employee_id

      LEFT JOIN token_item ti ON t.token_id = ti.token_id
      LEFT JOIN medicine m    ON ti.medicine_id = m.medicine_id

      WHERE t.status = 'Consumed' 
      ORDER BY t.issued_time ASC
    `);
    const tokensMap = new Map();

    for (const row of rows) {
      if (!tokensMap.has(row.token_id)) {
        tokensMap.set(row.token_id, {
          token_id: row.token_id,
          token_uuid: row.token_uuid,
          issued_time: row.issued_time,
          status: row.status,
          patient_name: row.patient_name,
          doctor_name: row.doctor_name,
          card_id: row.card_id,
          visit_id: row.visit_id,
          visit_date: row.visit_date,
          items: [],
        });
      }

      // add item only if exists
      if (row.medicine_id) {
        tokensMap.get(row.token_id).items.push({
          medicine_id: row.medicine_id,
          medicine_name: row.medicine_name,
          quantity: row.quantity,
        });
      }
    }

    const result = Array.from(tokensMap.values());

    return ok(res, { data: result });
  } catch (err) {
    serverError(res, err, "nurse.getPendingTokens");
  }
};

// POST /api/nurse/requisition
const createRequisition = async (req, res) => {
  const conn = await db.getConnection(); // important for transaction

  try {
    const nurseId = req.user.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return badRequest(res, "Items are required");
    }

    // Validate items
    for (const item of items) {
      if (!item.medicineId || !item.quantity || item.quantity <= 0) {
        return badRequest(res, "Invalid medicine data");
      }
    }

    // Generate requisition ID → REQYYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const requisitionId = `REQ${datePart}-${randomPart}`;

    await conn.beginTransaction();

    // Insert into substore_requisition
    await conn.query(
      `INSERT INTO substore_requisition 
       (requisition_id, made_by, status)
       VALUES (?, ?, 'Pending')`,
      [requisitionId, nurseId],
    );

    // Insert items
    for (const item of items) {
      await conn.query(
        `INSERT INTO requisition_item 
         (requisition_id, medicine_id, quantity_asked)
         VALUES (?, ?, ?)`,
        [requisitionId, item.medicineId, item.quantity],
      );
    }

    await conn.commit();

    return ok(res, { requisitionId }, "Requisition created successfully");
  } catch (err) {
    await conn.rollback();
    serverError(res, err, "nurse.createRequisition");
  } finally {
    conn.release();
  }
};

// GET /api/nurse/requisitions/history
const getRequisitionHistory = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        sr.requisition_id,
        sr.status,
        sr.created_at,
        sr.made_by,

        e.fullname AS nurse_name,

        ri.medicine_id,
        ri.quantity_asked,
        ri.quantity_approved,

        m.name AS medicine_name

      FROM substore_requisition sr
      JOIN employee e 
        ON sr.made_by = e.employee_id

      LEFT JOIN requisition_item ri 
        ON sr.requisition_id = ri.requisition_id

      LEFT JOIN medicine m 
        ON ri.medicine_id = m.medicine_id

      ORDER BY sr.created_at DESC
      LIMIT 50
    `);

    const map = new Map();

    for (const row of rows) {
      if (!map.has(row.requisition_id)) {
        map.set(row.requisition_id, {
          requisition_id: row.requisition_id,
          nurse_id: row.made_by,
          nurse_name: row.nurse_name,
          status: row.status,
          created_at: row.created_at,
          items: [],
        });
      }

      if (row.medicine_id) {
        map.get(row.requisition_id).items.push({
          medicine_id: row.medicine_id,
          medicine_name: row.medicine_name,
          quantity_asked: row.quantity_asked,
          quantity_approved: row.quantity_approved,
        });
      }
    }

    return ok(res, { data: Array.from(map.values()) });
  } catch (err) {
    serverError(res, err, "nurse.getRequisitionHistory");
  }
};


// GET api/nurse/first-aid/processed
const getProcessedFirstAidRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT far.*, p.fullname
       FROM first_aid_request far
       JOIN MedicalCard mc ON far.requested_by = mc.CardID
       JOIN Person p ON mc.PersonID = p.person_id
       WHERE far.statue = 'PROCESSED'
       ORDER BY far.processed_date DESC`
    );

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "pharmacist.getProcessedFirstAidRequests");
  }
};

// POST /api/nurse/first-aid/:requestId/dispense
const dispenseFirstAidRequest = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { requestId } = req.params;
    const employeeId = req.user.id;

    await connection.beginTransaction();

    // 1️⃣ Lock request
    const [[request]] = await connection.query(
      `SELECT * 
       FROM first_aid_request 
       WHERE request_id = ? 
       FOR UPDATE`,
      [requestId]
    );

    if (!request) {
      await connection.rollback();
      return notFound(res, "Request not found");
    }

    if (request.statue !== "PROCESSED") {
      await connection.rollback();
      return badRequest(res, "Only processed requests can be dispensed");
    }

    // Prevent double dispense
    if (request.statue === "DISPENSED") {
      await connection.rollback();
      return badRequest(res, "Already dispensed");
    }

    // 2️⃣ Get items
    const [items] = await connection.query(
      `SELECT * 
       FROM first_aid_item 
       WHERE request_id = ?`,
      [requestId]
    );

    if (!items.length) {
      await connection.rollback();
      return badRequest(res, "No items found for this request");
    }

    // 3️⃣ Process each item
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) continue;

      // 🔒 Lock substore row
      const [[substore]] = await connection.query(
        `SELECT quantity 
         FROM substore_inventory 
         WHERE medicine_id = ? 
         FOR UPDATE`,
        [item.medicine_id]
      );

      const stock = substore?.quantity || 0;

      if (stock < item.quantity) {
        await connection.rollback();
        return badRequest(
          res,
          `Insufficient substore stock for medicine_id ${item.medicine_id}`
        );
      }

      // 4️⃣ Record dispensation (NO token → use NULL)
      await connection.query(
        `INSERT INTO medicine_dispensation 
         (token_id, medicine_id, quantity_dispensed, dispensed_by, dispensed_time)
         VALUES (?, ?, ?, ?, ?)`,
        [
          null, // no token for first aid
          item.medicine_id,
          item.quantity,
          employeeId,
          new Date(),
        ]
      );

      // 5️⃣ Deduct from substore
      await connection.query(
        `UPDATE substore_inventory 
         SET quantity = quantity - ? 
         WHERE medicine_id = ?`,
        [item.quantity, item.medicine_id]
      );
    }

    // 6️⃣ Update request status
    await connection.query(
      `UPDATE first_aid_request 
       SET statue = 'DISPENSED' 
       WHERE request_id = ?`,
      [requestId]
    );

    await connection.commit();

    return ok(res, {}, "First aid request dispensed successfully");
  } catch (err) {
    await connection.rollback();
    serverError(res, err, "nurse.dispenseFirstAidRequest");
  } finally {
    connection.release();
  }
};

// substore inventory for requisition form
const getSubstoreInventory = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
          si.medicine_id,
          m.name,
          m.generic_name,
          m.catagory,
          si.quantity,
          si.last_updated
      FROM substore_inventory si
      JOIN medicine m 
          ON si.medicine_id = m.medicine_id
      ORDER BY m.name ASC
    `);
    return ok(res, { data: rows }, "Substore inventory fetched successfully");
    // return res.status(200).json({
    //   success: true,
    //   count: rows.length,
    //   data: rows,
    // });

  } catch (error) {
    console.error("Error fetching substore inventory:", error);
    return serverError(res, error, "nurse.getSubstoreInventory");
  }
};

module.exports = {
  getPendingTokens,
  getPrescription,
  dispenseMedicine,
  getDispensationHistory,
  createRequisition,
  getRequisitionHistory,
  getProcessedFirstAidRequests,
  dispenseFirstAidRequest,
  getSubstoreInventory,
};

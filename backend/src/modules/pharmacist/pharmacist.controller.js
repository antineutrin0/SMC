const db = require("../../config/db");
const {
  ok,
  created,
  notFound,
  serverError,
  badRequest,
} = require("../../utils/response");

// GET /api/pharmacist/medicines
const getMedicines = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.medicine_id, m.name, m.generic_name, m.catagory,
              COALESCE(SUM(mi.quantity), 0) AS total_quantity,
              MIN(mi.exp_date)              AS nearest_expiry,
              COUNT(mi.medicine_id)         AS batch_count
       FROM medicine m
       LEFT JOIN medicine_inventory mi ON m.medicine_id = mi.medicine_id
       GROUP BY m.medicine_id
       ORDER BY m.name`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "pharmacist.getMedicines");
  }
};

const getAllInventory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          mi.medicine_id,
          m.name,
          m.generic_name,
          m.catagory,
          SUM(mi.quantity)        AS total_quantity,
          MIN(mi.exp_date)        AS nearest_expiry,
          COUNT(mi.inventory_id)  AS batch_count
       FROM medicine_inventory mi
       INNER JOIN medicine m 
         ON mi.medicine_id = m.medicine_id
       GROUP BY mi.medicine_id
       ORDER BY m.name`,
    );

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "pharmacist.getInventory");
  }
};

// POST /api/pharmacist/medicines
const addMedicine = async (req, res) => {
  try {
    const { name, genericName, category } = req.body;

    const [result] = await db.query(
      "INSERT INTO medicine (name, generic_name, catagory) VALUES (?, ?, ?)",
      [name, genericName || null, category || null],
    );
    return created(
      res,
      { data: { medicineId: result.insertId } },
      "Medicine added",
    );
  } catch (err) {
    serverError(res, err, "pharmacist.addMedicine");
  }
};

// PUT /api/pharmacist/medicines/:id
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, genericName, category } = req.body;

    await db.query(
      "UPDATE medicine SET name = ?, generic_name = ?, catagory = ? WHERE medicine_id = ?",
      [name, genericName || null, category || null, id],
    );
    return ok(res, {}, "Medicine updated");
  } catch (err) {
    serverError(res, err, "pharmacist.updateMedicine");
  }
};

// DELETE /api/pharmacist/medicines/:id
const deleteMedicine = async (req, res) => {
  try {
    await db.query("DELETE FROM medicine WHERE medicine_id = ?", [
      req.params.id,
    ]);
    return ok(res, {}, "Medicine deleted");
  } catch (err) {
    serverError(res, err, "pharmacist.deleteMedicine");
  }
};

// POST /api/pharmacist/inventory
const addInventory = async (req, res) => {
  try {
    const { medicineId, quantity, expDate } = req.body;
    const employeeId = req.user.id;

    await db.query(
      "INSERT INTO medicine_inventory (medicine_id, quantity, added_at, exp_date) VALUES (?, ?, NOW(), ?)",
      [medicineId, quantity, expDate],
    );

    const [[{ total }]] = await db.query(
      "SELECT COALESCE(SUM(quantity), 0) AS total FROM medicine_inventory WHERE medicine_id = ?",
      [medicineId],
    );

    await db.query(
      `INSERT INTO medicine_transaction (medicine_id, transaction_type, quantity, made_by, transaction_date, reference_type, balance_after)
       VALUES (?, 'IN', ?, ?, NOW(), 'Substore', ?)`,
      [medicineId, quantity, employeeId, total],
    );

    return created(res, { data: { newTotal: total } }, "Inventory updated");
  } catch (err) {
    serverError(res, err, "pharmacist.addInventory");
  }
};

// GET /api/pharmacist/inventory/:medicineId
const getInventory = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM medicine_inventory WHERE medicine_id = ? ORDER BY exp_date ASC",
      [req.params.medicineId],
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "pharmacist.getInventory");
  }
};

// GET /api/pharmacist/transactions
const getTransactions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mt.*, m.name AS medicine_name, e.fullname AS employee_name
       FROM medicine_transaction mt
       JOIN medicine  m ON mt.medicine_id = m.medicine_id
       JOIN employee  e ON mt.made_by     = e.employee_id
       ORDER BY mt.transaction_date DESC
       LIMIT 100`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "pharmacist.getTransactions");
  }
};

// GET /api/pharmacist/first-aid
const getFirstAidRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT far.*,
              mc.CardID,
              p.fullname  AS requester_name,
              e.fullname AS approved_by_name
       FROM first_aid_request far
       JOIN MedicalCard mc ON far.requested_by = mc.CardID
       JOIN Person p       ON mc.PersonID      = p.person_id
       LEFT JOIN employee e ON far.approved_by = e.employee_id
       ORDER BY far.request_date DESC`,
    );

    for (const row of rows) {
      const [items] = await db.query(
        `SELECT fai.*, m.name AS medicine_name
         FROM first_aid_item fai
         JOIN medicine m ON fai.medicine_id = m.medicine_id
         WHERE fai.request_id = ?`,
        [row.request_id],
      );
      row.items = items;
    }

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "pharmacist.getFirstAidRequests");
  }
};

// PATCH /api/pharmacist/first-aid/:id
const reviewFirstAidRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const reviewerId = req.user.id;

    await db.query(
      "UPDATE first_aid_request SET statue = ?, approved_by = ? WHERE request_id = ?",
      [status, reviewerId, id],
    );

    if (status === "APPROVED") {
      const [items] = await db.query(
        "SELECT * FROM first_aid_item WHERE request_id = ?",
        [id],
      );
      for (const item of items) {
        const [[{ total }]] = await db.query(
          "SELECT COALESCE(SUM(quantity), 0) AS total FROM medicine_inventory WHERE medicine_id = ?",
          [item.medicine_id],
        );
        await db.query(
          `INSERT INTO medicine_transaction (medicine_id, transaction_type, quantity, made_by, reference_type, reference_id, balance_after)
           VALUES (?, 'OUT', ?, ?, 'StudyTour', ?, ?)`,
          [
            item.medicine_id,
            item.quantity,
            reviewerId,
            id,
            total - item.quantity,
          ],
        );
      }
    }

    return ok(res, {}, `First aid request ${status.toLowerCase()}`);
  } catch (err) {
    serverError(res, err, "pharmacist.reviewFirstAidRequest");
  }
};

// GET /api/pharmacist/requisitions
const getRequisitions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        sr.requisition_id,
        sr.made_by,
        sr.status,
        sr.created_at,

        e.fullname AS requested_by_name,

        ri.medicine_id,
        ri.quantity_asked,
        ri.quantity_approved,

        m.name AS medicine_name

      FROM substore_requisition sr
      JOIN employee e ON sr.made_by = e.employee_id
      LEFT JOIN requisition_item ri ON sr.requisition_id = ri.requisition_id
      LEFT JOIN medicine m ON ri.medicine_id = m.medicine_id

      ORDER BY sr.created_at DESC
      LIMIT 50
    `);

    const map = new Map();

    for (const row of rows) {
      if (!map.has(row.requisition_id)) {
        map.set(row.requisition_id, {
          requisition_id: row.requisition_id,
          made_by: row.made_by,
          requested_by_name: row.requested_by_name,
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
    serverError(res, err, "pharmacist.getRequisitions");
  }
};

// POST /api/pharmacist/requisitions/:id/process
const processRequisition = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;
    const { status, items } = req.body;
    const employeeId = req.user.id;

    if (!status) return badRequest(res, "Status required");

    await conn.beginTransaction();

    // ❌ REJECT CASE
    if (status === "Rejected") {
      await conn.query(
        "UPDATE substore_requisition SET status = 'Rejected' WHERE requisition_id = ?",
        [id],
      );

      await conn.commit();
      return ok(res, {}, "Requisition rejected");
    }

    // ✅ PROCESS / PARTIAL APPROVAL
    for (const item of items) {
      let remaining = item.approvedQuantity;

      // update approved quantity
      await conn.query(
        `UPDATE requisition_item 
         SET quantity_approved = ?
         WHERE requisition_id = ? AND medicine_id = ?`,
        [item.approvedQuantity, id, item.medicineId],
      );

      if (remaining <= 0) continue;

      // 🔥 FIFO deduction
      const [batches] = await conn.query(
        `SELECT inventory_id, quantity 
         FROM medicine_inventory
         WHERE medicine_id = ? AND quantity > 0
         ORDER BY exp_date ASC`,
        [item.medicineId],
      );

      for (const batch of batches) {
        if (remaining <= 0) break;

        const deduct = Math.min(batch.quantity, remaining);

        await conn.query(
          `UPDATE medicine_inventory
           SET quantity = quantity - ?
           WHERE inventory_id = ?`,
          [deduct, batch.inventory_id],
        );

        remaining -= deduct;
      }

      // ❗ Optional: handle insufficient stock
      if (remaining > 0) {
        //serverError(res, new Error(`Insufficient stock for medicine ID ${item.medicineId}`), "pharmacist.processRequisition");
        throw new Error(`Insufficient stock for medicine ${item.medicineId}`);
      }

      // ✅ get new balance
      const [[{ total }]] = await conn.query(
        `SELECT COALESCE(SUM(quantity),0) AS total 
         FROM medicine_inventory 
         WHERE medicine_id = ?`,
        [item.medicineId],
      );

      // ✅ transaction log
      await conn.query(
        `INSERT INTO medicine_transaction
         (medicine_id, transaction_type, quantity, made_by, reference_type, reference_id, balance_after)
         VALUES (?, 'OUT', ?, ?, 'Requisition', ?, ?)`,
        [item.medicineId, item.approvedQuantity, employeeId, id, total],
      );
    }

    // ✅ update requisition status
    await conn.query(
      `UPDATE substore_requisition 
       SET status = 'Processed' 
       WHERE requisition_id = ?`,
      [id],
    );

    await conn.commit();

    return ok(res, {}, "Requisition processed successfully");
  } catch (err) {
    await conn.rollback();
    serverError(res, err, "pharmacist.processRequisition");
  } finally {
    conn.release();
  }
};

// GET /pharmacist/first-aid/processed
const getProcessedFirstAidRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT far.*, p.fullname
       FROM first_aid_request far
       JOIN MedicalCard mc ON far.requested_by = mc.CardID
       JOIN Person p ON mc.PersonID = p.person_id
       WHERE far.statue = 'PROCESSED'
       ORDER BY far.processed_date DESC`,
    );

    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "pharmacist.getProcessedFirstAidRequests");
  }
};

// POST /pharmacist/first-aid/:requestId/dispense
const dispenseFirstAidRequest = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { requestId } = req.params;
    const pharmacistId = req.user.id;

    await connection.beginTransaction();

    // 1️⃣ Lock request
    const [[request]] = await connection.query(
      "SELECT * FROM first_aid_request WHERE request_id = ? FOR UPDATE",
      [requestId],
    );

    if (!request) {
      await connection.rollback();
      return notFound(res, "Request not found");
    }

    if (request.statue !== "PROCESSED") {
      await connection.rollback();
      return badRequest(res, "Only processed requests can be dispensed");
    }

    // 2️⃣ Get items
    const [items] = await connection.query(
      "SELECT * FROM first_aid_item WHERE request_id = ?",
      [requestId],
    );

    if (!items.length) {
      await connection.rollback();
      return badRequest(res, "No items found for this request");
    }

    // 3️⃣ Process each item
    for (const item of items) {
      const [[{ total }]] = await connection.query(
        `SELECT COALESCE(SUM(quantity),0) AS total
         FROM medicine_inventory
         WHERE medicine_id = ?`,
        [item.medicine_id],
      );

      if (total < item.quantity) {
        await connection.rollback();
        return badRequest(
          res,
          `Insufficient stock for medicine_id ${item.medicine_id}`,
        );
      }

      // Deduct from inventory (FIFO-style naive deduction)
      let remaining = item.quantity;

      const [batches] = await connection.query(
        `SELECT inventory_id, quantity 
         FROM medicine_inventory
         WHERE medicine_id = ? 
         ORDER BY exp_date ASC`,
        [item.medicine_id],
      );

      for (const batch of batches) {
        if (remaining <= 0) break;

        const deduct = Math.min(batch.quantity, remaining);

        await connection.query(
          "UPDATE medicine_inventory SET quantity = quantity - ? WHERE inventory_id = ?",
          [deduct, batch.inventory_id],
        );

        remaining -= deduct;
      }

      // Insert transaction log
      await connection.query(
        `INSERT INTO medicine_transaction 
         (medicine_id, transaction_type, quantity, made_by, reference_type, reference_id, balance_after)
         VALUES (?, 'OUT', ?, ?, 'FirstAid', ?, ?)`,
        [
          item.medicine_id,
          item.quantity,
          pharmacistId,
          requestId,
          total - item.quantity,
        ],
      );
    }

    // 4️⃣ Update request status
    await connection.query(
      `UPDATE first_aid_request 
       SET statue = 'DISPENSED'
       WHERE request_id = ?`,
      [requestId],
    );

    await connection.commit();

    return ok(res, {}, "First aid request dispensed successfully");
  } catch (err) {
    await connection.rollback();
    serverError(res, err, "pharmacist.dispenseFirstAidRequest");
  } finally {
    connection.release();
  }
};

module.exports = {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  addInventory,
  getInventory,
  getTransactions,
  getFirstAidRequests,
  reviewFirstAidRequest,
  getRequisitions,
  processRequisition,
  getAllInventory,
};

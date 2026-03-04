const db = require("../../config/db");
const { ok, created, notFound, serverError, badRequest } = require("../../utils/response");

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
       ORDER BY m.name`
    );
    return ok(res, { data: rows });
  } catch (err) { serverError(res, err, "pharmacist.getMedicines"); }
};

// POST /api/pharmacist/medicines
const addMedicine = async (req, res) => {
  try {
    const { name, genericName, category } = req.body;

    const [result] = await db.query(
      "INSERT INTO medicine (name, generic_name, catagory) VALUES (?, ?, ?)",
      [name, genericName || null, category || null]
    );
    return created(res, { data: { medicineId: result.insertId } }, "Medicine added");
  } catch (err) { serverError(res, err, "pharmacist.addMedicine"); }
};

// PUT /api/pharmacist/medicines/:id
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, genericName, category } = req.body;

    await db.query(
      "UPDATE medicine SET name = ?, generic_name = ?, catagory = ? WHERE medicine_id = ?",
      [name, genericName || null, category || null, id]
    );
    return ok(res, {}, "Medicine updated");
  } catch (err) { serverError(res, err, "pharmacist.updateMedicine"); }
};

// DELETE /api/pharmacist/medicines/:id
const deleteMedicine = async (req, res) => {
  try {
    await db.query("DELETE FROM medicine WHERE medicine_id = ?", [req.params.id]);
    return ok(res, {}, "Medicine deleted");
  } catch (err) { serverError(res, err, "pharmacist.deleteMedicine"); }
};

// POST /api/pharmacist/inventory
const addInventory = async (req, res) => {
  try {
    const { medicineId, quantity, expDate } = req.body;
    const employeeId = req.user.id;

    await db.query(
      "INSERT INTO medicine_inventory (medicine_id, quantity, added_at, exp_date) VALUES (?, ?, NOW(), ?)",
      [medicineId, quantity, expDate]
    );

    const [[{ total }]] = await db.query(
      "SELECT COALESCE(SUM(quantity), 0) AS total FROM medicine_inventory WHERE medicine_id = ?",
      [medicineId]
    );

    await db.query(
      `INSERT INTO medicine_transaction (medicine_id, transaction_type, quantity, made_by, transaction_date, reference_type, balance_after)
       VALUES (?, 'IN', ?, ?, NOW(), 'Substore', ?)`,
      [medicineId, quantity, employeeId, total]
    );

    return created(res, { data: { newTotal: total } }, "Inventory updated");
  } catch (err) { serverError(res, err, "pharmacist.addInventory"); }
};

// GET /api/pharmacist/inventory/:medicineId
const getInventory = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM medicine_inventory WHERE medicine_id = ? ORDER BY exp_date ASC",
      [req.params.medicineId]
    );
    return ok(res, { data: rows });
  } catch (err) { serverError(res, err, "pharmacist.getInventory"); }
};

// GET /api/pharmacist/transactions
const getTransactions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mt.*, m.name AS medicine_name, e.full_name AS employee_name
       FROM medicine_transaction mt
       JOIN medicine  m ON mt.medicine_id = m.medicine_id
       JOIN Employee  e ON mt.made_by     = e.employee_id
       ORDER BY mt.transaction_date DESC
       LIMIT 100`
    );
    return ok(res, { data: rows });
  } catch (err) { serverError(res, err, "pharmacist.getTransactions"); }
};

// GET /api/pharmacist/first-aid
const getFirstAidRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT far.*,
              mc.CardID,
              p.fullname  AS requester_name,
              e.full_name AS approved_by_name
       FROM first_aid_request far
       JOIN MedicalCard mc ON far.requested_by = mc.CardID
       JOIN Person p       ON mc.PersonID      = p.person_id
       LEFT JOIN Employee e ON far.approved_by = e.employee_id
       ORDER BY far.request_date DESC`
    );

    for (const row of rows) {
      const [items] = await db.query(
        `SELECT fai.*, m.name AS medicine_name
         FROM first_aid_item fai
         JOIN medicine m ON fai.medicine_id = m.medicine_id
         WHERE fai.request_id = ?`,
        [row.request_id]
      );
      row.items = items;
    }

    return ok(res, { data: rows });
  } catch (err) { serverError(res, err, "pharmacist.getFirstAidRequests"); }
};

// PATCH /api/pharmacist/first-aid/:id
const reviewFirstAidRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const reviewerId = req.user.id;

    await db.query(
      "UPDATE first_aid_request SET statue = ?, approved_by = ? WHERE request_id = ?",
      [status, reviewerId, id]
    );

    if (status === "APPROVED") {
      const [items] = await db.query("SELECT * FROM first_aid_item WHERE request_id = ?", [id]);
      for (const item of items) {
        const [[{ total }]] = await db.query(
          "SELECT COALESCE(SUM(quantity), 0) AS total FROM medicine_inventory WHERE medicine_id = ?",
          [item.medicine_id]
        );
        await db.query(
          `INSERT INTO medicine_transaction (medicine_id, transaction_type, quantity, made_by, reference_type, reference, balance_after)
           VALUES (?, 'OUT', ?, ?, 'StudyTour', ?, ?)`,
          [item.medicine_id, item.quantity, reviewerId, id, total - item.quantity]
        );
      }
    }

    return ok(res, {}, `First aid request ${status.toLowerCase()}`);
  } catch (err) { serverError(res, err, "pharmacist.reviewFirstAidRequest"); }
};

// GET /api/pharmacist/requisitions
const getRequisitions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sr.*, e.full_name AS requested_by_name
       FROM substore_requisition sr
       JOIN Employee e ON sr.made_by = e.employee_id
       ORDER BY sr.requisition_id DESC`
    );
    for (const row of rows) {
      const [items] = await db.query(
        `SELECT ri.*, m.name AS medicine_name
         FROM requisition_item ri
         JOIN medicine m ON ri.medicine_id = m.medicine_id
         WHERE ri.requisition_id = ?`,
        [row.requisition_id]
      );
      row.items = items;
    }
    return ok(res, { data: rows });
  } catch (err) { serverError(res, err, "pharmacist.getRequisitions"); }
};

// POST /api/pharmacist/requisitions/:id/process
const processRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    const [items] = await db.query("SELECT * FROM requisition_item WHERE requisition_id = ?", [id]);

    for (const item of items) {
      await db.query(
        `UPDATE medicine_inventory SET quantity = quantity - ?
         WHERE medicine_id = ? AND quantity >= ? ORDER BY exp_date ASC LIMIT 1`,
        [item.quantity, item.medicine_id, item.quantity]
      );

      const [[{ total }]] = await db.query(
        "SELECT COALESCE(SUM(quantity), 0) AS total FROM medicine_inventory WHERE medicine_id = ?",
        [item.medicine_id]
      );

      await db.query(
        `INSERT INTO medicine_transaction (medicine_id, transaction_type, quantity, made_by, reference_type, reference, balance_after)
         VALUES (?, 'OUT', ?, ?, 'Substore', ?, ?)`,
        [item.medicine_id, item.quantity, employeeId, id, total]
      );
    }

    await db.query("UPDATE substore_requisition SET status = 'PROCESSED' WHERE requisition_id = ?", [id]);
    return ok(res, {}, "Requisition processed");
  } catch (err) { serverError(res, err, "pharmacist.processRequisition"); }
};

module.exports = {
  getMedicines, addMedicine, updateMedicine, deleteMedicine,
  addInventory, getInventory, getTransactions,
  getFirstAidRequests, reviewFirstAidRequest,
  getRequisitions, processRequisition,
};

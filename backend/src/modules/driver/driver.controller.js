const db = require("../../config/db");
const {
  ok,
  created,
  notFound,
  serverError,
  badRequest,
} = require("../../utils/response");

// GET /api/driver/:driverId/logs
const getLogs = async (req, res) => {
  try {
    const driverId = req.params.driverId || req.user.id;

    const [rows] = await db.query(
      `SELECT al.log_id, al.pickup_location, al.destination,
              al.departure_time, al.return_time,
              mc.CardID, p.fullname AS patient_name, p.contact_number
       FROM ambulance_log al
       JOIN MedicalCard mc ON al.patient_id = mc.CardID
       JOIN Person p        ON mc.PersonID  = p.person_id
       WHERE al.driver_id = ?
       ORDER BY al.departure_time DESC`,
      [driverId],
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "driver.getLogs");
  }
};

// GET /api/driver/logs/all  (all drivers, admin-like summary)
const getAllLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT al.*, mc.CardID,
              p.fullname  AS patient_name, p.contact_number,
              e.fullname AS driver_name
       FROM ambulance_log al
       JOIN MedicalCard mc ON al.patient_id = mc.CardID
       JOIN Person p        ON mc.PersonID  = p.person_id
       LEFT JOIN Employee e ON al.driver_id = e.employee_id
       ORDER BY al.departure_time DESC
       LIMIT 100`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "driver.getAllLogs");
  }
};

// POST /api/driver/logs
const createLog = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { patientId, pickupLocation, destination, departureTime } = req.body;

    // Verify patient card exists
    const [cardRows] = await db.query(
      "SELECT CardID FROM MedicalCard WHERE CardID = ? AND Status = 'Active'",
      [patientId],
    );
    if (!cardRows.length)
      return notFound(res, "Active medical card not found for given patientId");

    const [result] = await db.query(
      `INSERT INTO ambulance_log (patient_id, driver_id, pickup_location, departure_time, destination)
       VALUES (?, ?, ?, ?, ?)`,
      [
        patientId,
        driverId,
        pickupLocation,
        departureTime || new Date(),
        destination,
      ],
    );

    return created(
      res,
      { data: { logId: result.insertId } },
      "Ambulance log created",
    );
  } catch (err) {
    serverError(res, err, "driver.createLog");
  }
};

// PATCH /api/driver/logs/:logId/complete
const completeTrip = async (req, res) => {
  try {
    const { logId } = req.params;
    const { returnTime } = req.body;
    const driverId = req.user.id;

    await db.query(
      "UPDATE ambulance_log SET return_time = ? WHERE log_id = ? AND driver_id = ?",
      [returnTime || new Date(), logId, driverId],
    );

    return ok(res, {}, "Trip completed");
  } catch (err) {
    serverError(res, err, "driver.completeTrip");
  }
};

// PATCH /api/driver/logs/:logId
const updateLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const { returnTime, destination, pickupLocation } = req.body;
    const driverId = req.user.id;

    await db.query(
      `UPDATE ambulance_log
       SET return_time = COALESCE(?, return_time),
           destination = COALESCE(?, destination),
           pickup_location = COALESCE(?, pickup_location)
       WHERE log_id = ? AND driver_id = ?`,
      [
        returnTime || null,
        destination || null,
        pickupLocation || null,
        logId,
        driverId,
      ],
    );

    return ok(res, {}, "Log updated");
  } catch (err) {
    serverError(res, err, "driver.updateLog");
  }
};

module.exports = { getLogs, getAllLogs, createLog, completeTrip, updateLog };

const db = require("../../config/db");
const { ok, serverError } = require("../../utils/response");

const getRoster = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.roster_id, r.duty_type, r.start_date, r.end_date,
              r.shift_start, r.shift_end, r.status,
              e.fullname AS employee_name, e.designation
       FROM roster r
       JOIN employee e ON r.employee_id = e.employee_id
       WHERE r.status = 'Approved'
         AND r.start_date <= CURDATE()
         AND r.end_date   >= CURDATE()
       ORDER BY e.designation, e.fullname`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "public.getRoster");
  }
};

const getEmployees = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT employee_id, fullname, designation, specialization, contact_no, photo_url
       FROM employee WHERE is_active = 1
       ORDER BY designation, fullname`,
    );
    return ok(res, { data: rows });
  } catch (err) {
    serverError(res, err, "public.getEmployees");
  }
};

const getServices = async (_req, res) => {
  const services = [
    {
      id: 1,
      name: "Outdoor Medical Services",
      description:
        "Regular medical checkups and consultations for students, teachers, and staff",
      icon: "Stethoscope",
    },
    {
      id: 2,
      name: "Emergency Ambulance",
      description: "24/7 ambulance services for medical emergencies",
      icon: "Ambulance",
    },
    {
      id: 3,
      name: "Medicine Distribution",
      description: "Free medicine distribution for prescribed medications",
      icon: "Pill",
    },
    {
      id: 4,
      name: "First Aid for Study Tours",
      description: "Medical supplies and support for educational trips",
      icon: "Backpack",
    },
  ];
  return ok(res, { data: services });
};

const getInfo = async (_req, res) => {
  const info = {
    name: "SUST Medical Centre",
    address: "Shahjalal University of Science & Technology",
    city: "Sylhet",
    country: "Bangladesh",
    phone: "+880-821-713491",
    email: "medical@sust.edu",
    operatingHours: {
      weekdays: "8:00 AM - 4:00 PM",
      saturday: "8:00 AM - 2:00 PM",
      emergency: "24/7",
    },
  };
  return ok(res, { data: info });
};

module.exports = { getRoster, getEmployees, getServices, getInfo };

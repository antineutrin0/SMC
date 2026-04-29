const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const DB_CONFIG = {
  host: process.env.DB_HOST || "sql12.freesqldatabase.com",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "sql12824876",
  password: process.env.DB_PASSWORD || "Xv93krq77i",
  database: process.env.DB_NAME || "sql12824876",
};

async function seed() {
  console.log(process.env.DB_HOST);
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log("Connected. Starting seed...\n");
  try {
    const EMP_PASS = await bcrypt.hash("Password@123", 10);
    const PATIENT_PASS = await bcrypt.hash("Patient@123", 10);

    // // ─── Employees ────────────────────────────────────────────────
    const employees = [
      [
        "ADM001",
        "Md. Karim Uddin",
        "Admin",
        null,
        null,
        null,
        "01711000001",
        1,
        EMP_PASS,
      ],
      [
        "REG001",
        "Ms. Sultana Akter",
        "Registrar",
        null,
        "REG-BD-0001",
        null,
        "01711000002",
        1,
        EMP_PASS,
      ],
      [
        "DOC001",
        "Dr. Arafat Hossain",
        "Doctor",
        "General Medicine",
        "BM&DC-001234",
        null,
        "01711000003",
        1,
        EMP_PASS,
      ],
      [
        "DOC002",
        "Dr. Nasrin Islam",
        "Doctor",
        "Gynecology",
        "BM&DC-002345",
        null,
        "01711000004",
        1,
        EMP_PASS,
      ],
      [
        "NUR001",
        "Ms. Taslima Khanam",
        "Nurse",
        null,
        "BNC-00123",
        null,
        "01711000005",
        1,
        EMP_PASS,
      ],
      [
        "NUR002",
        "Mr. Rafiqul Islam",
        "Nurse",
        null,
        "BNC-00124",
        null,
        "01711000006",
        1,
        EMP_PASS,
      ],
      [
        "DRV001",
        "Md. Jalal Uddin",
        "Driver",
        null,
        null,
        null,
        "01711000007",
        1,
        EMP_PASS,
      ],
      [
        "DRV002",
        "Md. Sabbir Ahmed",
        "Driver",
        null,
        null,
        null,
        "01711000008",
        1,
        EMP_PASS,
      ],
    ];
    for (const e of employees) {
      await conn.query(
        `INSERT IGNORE INTO Employee (employee_id,fullname,designation,specialization,license_no,photo_url,contact_no,is_active,password_hash)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        e,
      );
    }
    console.log("✅  Employees inserted");

    // // ─── Persons ──────────────────────────────────────────────────
    const persons = [
      [
        "2021331001",
        "Fahim Rahman",
        "2000-05-12",
        "01812340001",
        "fahim@student.sust.edu",
        "Sylhet Sadar",
        "Sylhet",
        "Sylhet",
        "Bangladesh",
        "student",
      ],
      [
        "2021331002",
        "Nusrat Jahan",
        "2001-03-22",
        "01812340002",
        "nusrat@student.sust.edu",
        "Jalalabad",
        "Sylhet",
        "Sylhet",
        "Bangladesh",
        "student",
      ],
      [
        "2021331003",
        "Arif Mahmud",
        "1999-11-05",
        "01812340003",
        "arif@student.sust.edu",
        "Golapganj",
        "Sylhet",
        "Sylhet",
        "Bangladesh",
        "student",
      ],
      [
        "TCH001",
        "Prof. Dr. Alam",
        "1970-07-18",
        "01912340001",
        "alam@sust.edu",
        "Sylhet Sadar",
        "Sylhet",
        "Sylhet",
        "Bangladesh",
        "teacher",
      ],
      [
        "TCH002",
        "Dr. Fatema Begum",
        "1975-09-25",
        "01912340002",
        "fatema@sust.edu",
        "Shahporan",
        "Sylhet",
        "Sylhet",
        "Bangladesh",
        "teacher",
      ],
      [
        "OFF001",
        "Mr. Kamal Hosen",
        "1985-01-30",
        "01612340001",
        "kamal@sust.edu",
        "Sylhet Sadar",
        "Sylhet",
        "Sylhet",
        "Bangladesh",
        "officer",
      ],
    ];
    for (const p of persons) {
      await conn.query(
        `INSERT IGNORE INTO Person (person_id,fullname,date_of_birth,contact_number,email,upazilla,district,division,country,type)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        p,
      );
    }
    console.log("✅  Persons inserted");

    // // ─── Medical Card Applications ────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO MedicalCardApplication
        (ApplicationDate,ApplicationStatus,PhotoUrl,IdCardUrl,ReviewDate,ReviewerId,ReviewerComments,ApprovedBy,ApprovedDate,PersonID)
      VALUES
        ('2023-01-10','Approved',NULL,NULL,'2023-01-12','ADM001','Looks good','ADM001','2023-01-12','2021331001'),
        ('2023-02-05','Approved',NULL,NULL,'2023-02-07','ADM001','Approved',  'ADM001','2023-02-07','2021331002'),
        ('2023-03-15','Approved',NULL,NULL,'2023-03-17','ADM001','Approved',  'ADM001','2023-03-17','2021331003'),
        ('2023-04-20','Approved',NULL,NULL,'2023-04-22','ADM001','Approved',  'ADM001','2023-04-22','TCH001'),
        ('2023-05-10','Approved',NULL,NULL,'2023-05-12','ADM001','Approved',  'ADM001','2023-05-12','TCH002'),
        ('2023-06-01','Approved',NULL,NULL,'2023-06-03','ADM001','Approved',  'ADM001','2023-06-03','OFF001'),
        ('2024-12-01','Pending', NULL,NULL,NULL,        NULL,    NULL,        NULL,     NULL,       '2021331001')
    `);
    console.log("✅  Applications inserted");

    // // ─── Medical Cards ────────────────────────────────────────────
    const cards = [
      [
        "MC2023001",
        "2023-01-12",
        "2026-01-12",
        "Active",
        "2021331001",
        170.5,
        65.0,
        "B+",
        PATIENT_PASS,
      ],
      [
        "MC2023002",
        "2023-02-07",
        "2026-02-07",
        "Active",
        "2021331002",
        155.0,
        50.0,
        "O+",
        PATIENT_PASS,
      ],
      [
        "MC2023003",
        "2023-03-17",
        "2026-03-17",
        "Active",
        "2021331003",
        168.0,
        70.0,
        "A+",
        PATIENT_PASS,
      ],
      [
        "MC2023004",
        "2023-04-22",
        "2026-04-22",
        "Active",
        "TCH001",
        175.0,
        80.0,
        "AB+",
        PATIENT_PASS,
      ],
      [
        "MC2023005",
        "2023-05-12",
        "2026-05-12",
        "Active",
        "TCH002",
        162.0,
        58.0,
        "B-",
        PATIENT_PASS,
      ],
      [
        "MC2023006",
        "2023-06-03",
        "2026-06-03",
        "Active",
        "OFF001",
        172.0,
        72.0,
        "O-",
        PATIENT_PASS,
      ],
    ];
    for (const c of cards) {
      await conn.query(
        `INSERT IGNORE INTO MedicalCard (CardID,IssueDate,ExpiryDate,Status,PersonID,Height_cm,Weight_kg,BloodGroup,PasswordHash)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        c,
      );
    }
    console.log("✅  Medical Cards inserted");

    // // ─── Medicines ────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO medicine (name,generic_name,catagory) VALUES
      ('Paracetamol 500mg', 'Acetaminophen',     'Analgesic/Antipyretic'),
      ('Amoxicillin 250mg', 'Amoxicillin',       'Antibiotic'),
      ('Antacid Suspension','Aluminum Hydroxide','Antacid'),
      ('ORS Sachet',        'Oral Rehydration',  'Electrolyte'),
      ('Vitamin C 500mg',   'Ascorbic Acid',     'Vitamin'),
      ('Ibuprofen 400mg',   'Ibuprofen',         'NSAID'),
      ('Cetirizine 10mg',   'Cetirizine',        'Antihistamine'),
      ('Omeprazole 20mg',   'Omeprazole',        'Proton Pump Inhibitor'),
      ('Metronidazole 400mg','Metronidazole',    'Antiprotozoal'),
      ('Salbutamol Inhaler','Salbutamol',        'Bronchodilator')
    `);
    console.log("✅  Medicines inserted");

    // // ─── Inventory ────────────────────────────────────────────────
    const inv = [
      [1, 500, "2025-12-31"],
      [1, 200, "2026-06-30"],
      [2, 300, "2025-11-30"],
      [2, 150, "2026-03-31"],
      [3, 400, "2025-10-31"],
      [4, 600, "2025-09-30"],
      [5, 350, "2026-01-31"],
      [6, 250, "2025-08-31"],
      [7, 200, "2025-12-31"],
      [8, 180, "2026-02-28"],
      [9, 120, "2025-11-30"],
      [10, 50, "2026-04-30"],
    ];
    for (const [m, q, e] of inv) {
      await conn.query(
        "INSERT INTO medicine_inventory (medicine_id,quantity,added_at,exp_date) VALUES (?,?,NOW(),?)",
        [m, q, e],
      );
    }
    console.log("✅  Inventory inserted");

    // ─── Transactions (IN for stock) ─────────────────────────────
    const totals = {
      1: 700,
      2: 450,
      3: 400,
      4: 600,
      5: 350,
      6: 250,
      7: 200,
      8: 180,
      9: 120,
      10: 50,
    };
    for (const [id, total] of Object.entries(totals)) {
      await conn.query(
        `INSERT INTO medicine_transaction (medicine_id,transaction_type,quantity,made_by,reference_type,balance_after)
         VALUES (?,'IN',?,'REG001','Substore',?)`,
        [id, total, total],
      );
    }
    console.log("✅  Transactions inserted");

    // ─── Outdoor Visits ───────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO outdoor_visit (card_id,doctor_id,visit_date) VALUES
      ('MC2023001','DOC001','2024-11-01 09:30:00'),
      ('MC2023002','DOC001','2024-11-02 10:00:00'),
      ('MC2023003','DOC002','2024-11-05 11:15:00'),
      ('MC2023004','DOC001','2024-11-10 09:00:00'),
      ('MC2023001','DOC002','2024-11-15 14:30:00'),
      ('MC2023005','DOC001','2024-12-01 08:45:00')
    `);
    console.log("✅  Visits inserted");

    // ─── Prescriptions ────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO prescription (visit_id,symptoms,advice,created_at) VALUES
      (1,'Headache and mild fever',  'Rest, drink water, avoid screen time','2024-11-01 09:35:00'),
      (2,'Sore throat and cough',    'Warm gargling, avoid cold drinks',    '2024-11-02 10:10:00'),
      (3,'Stomach pain and nausea',  'Light diet, avoid oily food',         '2024-11-05 11:25:00'),
      (4,'Back pain',                'Physiotherapy recommended',           '2024-11-10 09:15:00'),
      (5,'Seasonal allergy',         'Avoid dust and pollen',               '2024-11-15 14:40:00'),
      (6,'Acidity and bloating',     'Eat small meals, avoid spicy food',   '2024-12-01 08:55:00')
    `);
    console.log("✅  Prescriptions inserted");

    // ─── Medications ─────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO medication (prescription_id,medicine_id,dosage_amount,dosage_unit,duration_day,frequency) VALUES
      (1,1,500,'mg',5,3),
      (2,2,250,'mg',7,3),
      (3,3,10, 'ml',5,3),
      (4,1,500,'mg',5,3),
      (5,7,10, 'mg',7,1),
      (6,8,20, 'mg',7,1)
    `);
    console.log("✅  Medications inserted");

    // ─── Tokens ───────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO token (visit_id,issued_time) VALUES
      (1,'2024-11-01 09:36:00'),
      (2,'2024-11-02 10:11:00'),
      (3,'2024-11-05 11:26:00'),
      (4,'2024-11-10 09:16:00'),
      (5,'2024-11-15 14:41:00'),
      (6,'2024-12-01 08:56:00')
    `);
    console.log("✅  Tokens inserted");

    // ─── Dispensations (tokens 1-4 fulfilled) ────────────────────
    await conn.query(`
      INSERT IGNORE INTO medicine_dispensation (token_id,medicine_id,quantity_dispensed,dispensed_by,dispensed_time) VALUES
      (1,1,45,'NUR001','2024-11-01 09:50:00'),
      (2,2,52,'NUR001','2024-11-02 10:25:00'),
      (3,3,15,'NUR002','2024-11-05 11:40:00'),
      (4,1,42,'NUR002','2024-11-10 09:30:00')
    `);
    console.log("✅  Dispensations inserted  (tokens 5 & 6 pending)");

    // ─── Ambulance Logs ───────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO ambulance_log (patient_id,driver_id,pickup_location,departure_time,return_time,destination) VALUES
      ('MC2023001','DRV001','Shahjalal Hall',       '2024-10-10 02:15:00','2024-10-10 03:45:00','Sylhet MAG Osmani Medical College'),
      ('MC2023003','DRV001','Taltala Residential', '2024-11-20 14:00:00','2024-11-20 15:30:00','Mount Adora Hospital, Sylhet'),
      ('MC2023002','DRV002','Mujib Hall',           '2024-12-05 10:30:00',NULL,                 'Sylhet MAG Osmani Medical College')
    `);
    console.log("✅  Ambulance Logs inserted  (log 3 in progress)");

    // ─── First Aid Requests ───────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO first_aid_request (requested_by,trip_details,document_url,request_date,approved_by,statue) VALUES
      ('MC2023001',"Cox's Bazar study tour — 50 students, 3 days",NULL,'2024-11-25','REG001','APPROVED'),
      ('MC2023002','Srimangal study tour — 30 students, 2 days',  NULL,'2024-12-10',NULL,    'PENDING')
    `);
    await conn.query(`
      INSERT IGNORE INTO first_aid_item (request_id,medicine_id,quantity) VALUES
      (1,1,100),('FAR001',4,200),('FAR001',6,50),
      (2,1,80), ('FAR002',7,30)
    `);
    console.log("✅  First Aid Requests inserted");

    // ─── Rosters ──────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO roster
        (employee_id,duty_type,start_date,end_date,shift_start,shift_end,created_at,created_by,approved_by,status)
      VALUES
      ('DOC001','Physical','2026-03-01','2026-03-31','08:00:00','14:00:00','2024-12-20 10:00:00','ADM001','ADM001','Approved'),
      ('DOC002','On Call', '2026-03-01','2026-03-31','14:00:00','20:00:00','2024-12-20 10:00:00','ADM001','ADM001','Approved'),
      ('NUR001','Physical','2026-03-01','2026-03-31','08:00:00','16:00:00','2024-12-20 10:00:00','ADM001','ADM001','Approved'),
      ('DRV001','Physical','2026-03-01','2026-03-31','00:00:00','08:00:00','2024-12-20 10:00:00','ADM001','ADM001','Approved'),
      ('DRV002','On Call', '2026-03-01','2026-03-31','08:00:00','16:00:00','2024-12-20 10:00:00','ADM001',NULL,    'Draft')
    `);
    console.log("✅  Rosters inserted");

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉  Seed completed!

  STAFF (userType → identifier / password)
  admin       → ADM001   / Password@123
  pharmacist  → REG001   / Password@123
  doctor      → DOC001   / Password@123
  doctor      → DOC002   / Password@123
  nurse       → NUR001   / Password@123
  nurse       → NUR002   / Password@123
  driver      → DRV001   / Password@123
  driver      → DRV002   / Password@123

  PATIENTS (userType: patient)
  MC2023001  / Patient@123   (Fahim Rahman)
  MC2023002  / Patient@123   (Nusrat Jahan)
  MC2023003  / Patient@123   (Arif Mahmud)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  } catch (err) {
    console.error("❌  Seed error:", err.message);
    throw err;
  } finally {
    await conn.end();
  }
}

seed().catch(console.error);

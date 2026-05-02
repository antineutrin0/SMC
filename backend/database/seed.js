/**
 * SUST Medical Centre Management System (SMCMS)
 * Seed Script — creates tables (if not exists) and populates seed data
 * Compatible with freesqldatabase.com (MySQL 8.0)
 *
 * Staff credentials  → Password@123
 * Patient credentials → Patient@123
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smcdb",
  multipleStatements: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// DDL — CREATE TABLES IF NOT EXISTS
// ─────────────────────────────────────────────────────────────────────────────
const DDL = `

-- ── Person (students / teachers / officers before they get a medical card) ──
CREATE TABLE IF NOT EXISTS Person (
  person_id      VARCHAR(20)  NOT NULL,
  fullname       VARCHAR(100) NOT NULL,
  date_of_birth  DATE,
  contact_number VARCHAR(14),
  email          VARCHAR(100),
  upazilla       VARCHAR(50),
  district       VARCHAR(50),
  division       VARCHAR(50),
  country        VARCHAR(50)  DEFAULT 'Bangladesh',
  type           ENUM('student','teacher','officer') NOT NULL,
  PRIMARY KEY (person_id)
);

-- ── Employee (doctors, nurses, registrars, admins, drivers) ─────────────────
CREATE TABLE IF NOT EXISTS Employee (
  employee_id    VARCHAR(12)  NOT NULL,
  fullname       VARCHAR(100) NOT NULL,
  designation    ENUM('Doctor','Nurse','Registrar','Driver','Admin') NOT NULL,
  specialization VARCHAR(100),
  license_no     VARCHAR(20),
  photo_url      VARCHAR(255),
  contact_no     VARCHAR(14),
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  password_hash  VARCHAR(60)  NOT NULL,
  PRIMARY KEY (employee_id)
);

-- ── Medical Card Application ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MedicalCardApplication (
  ApplicationID     INT          NOT NULL AUTO_INCREMENT,
  ApplicationDate   DATE         NOT NULL,
  ApplicationStatus ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  PhotoUrl          VARCHAR(255),
  IdCardUrl         VARCHAR(255),
  ReviewDate        DATE,
  ReviewerId        VARCHAR(12),
  ReviewerComments  VARCHAR(500),
  ApprovedBy        VARCHAR(12),
  ApprovedDate      DATE,
  PersonID          VARCHAR(20)  NOT NULL,
  PRIMARY KEY (ApplicationID),
  FOREIGN KEY (PersonID)    REFERENCES Person(person_id),
  FOREIGN KEY (ReviewerId)  REFERENCES Employee(employee_id),
  FOREIGN KEY (ApprovedBy)  REFERENCES Employee(employee_id)
);

-- ── Medical Card ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MedicalCard (
  CardID        VARCHAR(12)  NOT NULL,
  IssueDate     DATE         NOT NULL,
  ExpiryDate    DATE         NOT NULL,
  Status        ENUM('Active','Expired','Suspended') NOT NULL DEFAULT 'Active',
  PersonID      VARCHAR(20)  NOT NULL,
  Height_cm     FLOAT,
  Weight_kg     FLOAT,
  BloodGroup    VARCHAR(3),
  PasswordHash  VARCHAR(60)  NOT NULL,
  PRIMARY KEY (CardID),
  UNIQUE KEY uq_card_person (PersonID),
  FOREIGN KEY (PersonID) REFERENCES Person(person_id)
);

-- ── Medicine (master catalogue) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicine (
  medicine_id  INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(60)  NOT NULL,
  generic_name VARCHAR(60),
  catagory     VARCHAR(60),
  PRIMARY KEY (medicine_id)
);

-- ── Medicine Inventory (batches with expiry) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS medicine_inventory (
  inventory_id  INT      NOT NULL AUTO_INCREMENT,
  medicine_id   INT      NOT NULL,
  quantity      INT      NOT NULL DEFAULT 0,
  added_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  exp_date      DATE     NOT NULL,
  PRIMARY KEY (inventory_id),
  FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id)
);

-- ── Medicine Transaction (audit ledger) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicine_transaction (
  transaction_id   INT          NOT NULL AUTO_INCREMENT,
  medicine_id      INT          NOT NULL,
  transaction_type ENUM('IN','OUT') NOT NULL,
  quantity         INT          NOT NULL,
  made_by          VARCHAR(12)  NOT NULL,
  transaction_date TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reference_type   VARCHAR(30),
  reference_id     VARCHAR(20),
  balance_after    INT          NOT NULL,
  PRIMARY KEY (transaction_id),
  FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id),
  FOREIGN KEY (made_by)     REFERENCES Employee(employee_id)
);

-- ── Outdoor Visit ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outdoor_visit (
  visit_id    INT         NOT NULL AUTO_INCREMENT,
  card_id     VARCHAR(12) NOT NULL,
  doctor_id   VARCHAR(12) NOT NULL,
  visit_date  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visit_type  ENUM('First Visit','Follow-up','Emergency') NOT NULL DEFAULT 'First Visit',
  PRIMARY KEY (visit_id),
  FOREIGN KEY (card_id)   REFERENCES MedicalCard(CardID),
  FOREIGN KEY (doctor_id) REFERENCES Employee(employee_id)
);

-- ── Prescription ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescription (
  prescription_id INT          NOT NULL AUTO_INCREMENT,
  visit_id        INT          NOT NULL,
  symptoms        VARCHAR(1000),
  advice          VARCHAR(500),
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (prescription_id),
  FOREIGN KEY (visit_id) REFERENCES outdoor_visit(visit_id)
);

-- ── Medication (prescription ↔ medicine) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS medication (
  prescription_id INT         NOT NULL,
  medicine_id     INT         NOT NULL,
  dosage_amount   INT         NOT NULL,
  dosage_unit     ENUM('ml','mg','unit') NOT NULL,
  duration_day    INT         NOT NULL DEFAULT 1,
  frequency       INT         NOT NULL DEFAULT 1 COMMENT 'times per day',
  PRIMARY KEY (prescription_id, medicine_id),
  FOREIGN KEY (prescription_id) REFERENCES prescription(prescription_id),
  FOREIGN KEY (medicine_id)     REFERENCES medicine(medicine_id)
);

-- ── Token (medicine collection slip) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token (
  token_id     INT         NOT NULL AUTO_INCREMENT,
  token_uuid VARCHAR(6) NOT NULL,
  visit_id     INT         NOT NULL,
  issued_time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status       ENUM('Pending','Consumed') NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (token_id),
  FOREIGN KEY (visit_id) REFERENCES outdoor_visit(visit_id)
);

-- Token Item (medicines linked to a token) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_item (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    
    -- Links this item to a specific dispensation token
    CONSTRAINT fk_token 
        FOREIGN KEY (token_id) REFERENCES token(token_id) 
        ON DELETE CASCADE,
        
    -- Links this item to the specific medicine being dispensed
    CONSTRAINT fk_medicine 
        FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id)
);


-- ── Substore Inventory ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS substore_inventory (
  medicine_id  INT      NOT NULL,
  quantity     INT      NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (medicine_id),
  FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id)
);

-- ── Medicine Dispensation ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicine_dispensation (
  dispensation_id     INT         NOT NULL AUTO_INCREMENT,
  token_id            INT         NOT NULL,
  medicine_id         INT         NOT NULL,
  quantity_dispensed  INT         NOT NULL,
  dispensed_by        VARCHAR(12) NOT NULL,
  dispensed_time      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (dispensation_id),
  FOREIGN KEY (token_id)      REFERENCES token(token_id),
  FOREIGN KEY (medicine_id)   REFERENCES medicine(medicine_id),
  FOREIGN KEY (dispensed_by)  REFERENCES Employee(employee_id)
);

-- ── Substore Requisition ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS substore_requisition (
  requisition_id VARCHAR(15)  NOT NULL,
  made_by        VARCHAR(12)  NOT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status         ENUM('Pending','Processed','Rejected') NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (requisition_id),
  FOREIGN KEY (made_by) REFERENCES Employee(employee_id)
);

-- ── Requisition Item ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requisition_item (
  requisition_id VARCHAR(15) NOT NULL,
  medicine_id    INT         NOT NULL,
  quantity       INT         NOT NULL,
  PRIMARY KEY (requisition_id, medicine_id),
  FOREIGN KEY (requisition_id) REFERENCES substore_requisition(requisition_id),
  FOREIGN KEY (medicine_id)    REFERENCES medicine(medicine_id)
);

-- ── First Aid Request ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS first_aid_request (
  request_id   VARCHAR(15)  NOT NULL,
  requested_by VARCHAR(12)  NOT NULL,
  trip_details VARCHAR(500),
  document_url VARCHAR(255),
  request_date DATE         NOT NULL,
  approved_by  VARCHAR(12),
  statue       ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (request_id),
  FOREIGN KEY (requested_by) REFERENCES MedicalCard(CardID),
  FOREIGN KEY (approved_by)  REFERENCES Employee(employee_id)
);

-- ── First Aid Item ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS first_aid_item (
  request_id  VARCHAR(15) NOT NULL,
  medicine_id INT         NOT NULL,
  quantity    INT         NOT NULL,
  PRIMARY KEY (request_id, medicine_id),
  FOREIGN KEY (request_id)  REFERENCES first_aid_request(request_id),
  FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id)
);

-- ── Ambulance Log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ambulance_log (
  log_id          INT         NOT NULL AUTO_INCREMENT,
  patient_id      VARCHAR(12) NOT NULL,
  driver_id       VARCHAR(12) NOT NULL,
  pickup_location VARCHAR(100),
  departure_time  TIMESTAMP    NOT NULL,
  return_time     TIMESTAMP,
  destination     VARCHAR(100),
  PRIMARY KEY (log_id),
  FOREIGN KEY (patient_id) REFERENCES MedicalCard(CardID),
  FOREIGN KEY (driver_id)  REFERENCES Employee(employee_id)
);

-- ── Roster ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roster (
  roster_id   INT         NOT NULL AUTO_INCREMENT,
  employee_id VARCHAR(12) NOT NULL,
  duty_type   ENUM('Physical','On Call') NOT NULL,
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  shift_start TIME,
  shift_end   TIME,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  VARCHAR(12) NOT NULL,
  approved_by VARCHAR(12),
  status      ENUM('Draft','Approved') NOT NULL DEFAULT 'Draft',
  PRIMARY KEY (roster_id),
  FOREIGN KEY (employee_id) REFERENCES Employee(employee_id),
  FOREIGN KEY (created_by)  REFERENCES Employee(employee_id),
  FOREIGN KEY (approved_by) REFERENCES Employee(employee_id)
);
`;

// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log("✅  Connected to database\n");

  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    // ── 1. Create tables ──────────────────────────────────────────────────────
    console.log("📦  Creating tables…");
    const statements = DDL.split(";").map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log("✅  All tables ready\n");

    // ── 2. Hashed passwords ───────────────────────────────────────────────────
    const EMP_PASS     = await bcrypt.hash("Password@123", 10);
    const PATIENT_PASS = await bcrypt.hash("Patient@123",  10);

    // ── 3. Employees ──────────────────────────────────────────────────────────
    const employees = [
      // [employee_id, fullname, designation, specialization, license_no, photo_url, contact_no, is_active, password_hash]
      ["ADM001", "Md. Karim Uddin",       "Admin",     null,                null,           null, "01711000001", 1, EMP_PASS],
      ["ADM002", "Dr. Nasima Akhter",     "Admin",     null,                null,           null, "01711000009", 1, EMP_PASS],
      ["REG001", "Ms. Sultana Akter",     "Registrar", null,                "REG-BD-0001",  null, "01711000002", 1, EMP_PASS],
      ["REG002", "Mr. Habibur Rahman",    "Registrar", null,                "REG-BD-0002",  null, "01711000010", 1, EMP_PASS],
      ["DOC001", "Dr. Arafat Hossain",    "Doctor",    "General Medicine",  "BM&DC-001234", null, "01711000003", 1, EMP_PASS],
      ["DOC002", "Dr. Nasrin Islam",      "Doctor",    "Gynecology",        "BM&DC-002345", null, "01711000004", 1, EMP_PASS],
      ["DOC003", "Dr. Saiful Alam",       "Doctor",    "Internal Medicine", "BM&DC-003456", null, "01711000011", 1, EMP_PASS],
      ["DOC004", "Dr. Maliha Chowdhury",  "Doctor",    "Dermatology",       "BM&DC-004567", null, "01711000012", 1, EMP_PASS],
      ["NUR001", "Ms. Taslima Khanam",    "Nurse",     null,                "BNC-00123",    null, "01711000005", 1, EMP_PASS],
      ["NUR002", "Mr. Rafiqul Islam",     "Nurse",     null,                "BNC-00124",    null, "01711000006", 1, EMP_PASS],
      ["NUR003", "Ms. Sharmin Akter",     "Nurse",     null,                "BNC-00125",    null, "01711000013", 1, EMP_PASS],
      ["DRV001", "Md. Jalal Uddin",       "Driver",    null,                null,           null, "01711000007", 1, EMP_PASS],
      ["DRV002", "Md. Sabbir Ahmed",      "Driver",    null,                null,           null, "01711000008", 1, EMP_PASS],
    ];

    for (const e of employees) {
      await conn.query(
        `INSERT IGNORE INTO Employee
           (employee_id,fullname,designation,specialization,license_no,photo_url,contact_no,is_active,password_hash)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        e,
      );
    }
    console.log("✅  Employees inserted");

    // ── 4. Persons ────────────────────────────────────────────────────────────
    const persons = [
      // students
      ["2021331001", "Fahim Rahman",        "2000-05-12", "01812340001", "fahim@student.sust.edu",    "Sylhet Sadar",    "Sylhet",      "Sylhet",    "Bangladesh", "student"],
      ["2021331002", "Nusrat Jahan",        "2001-03-22", "01812340002", "nusrat@student.sust.edu",   "Jalalabad",       "Sylhet",      "Sylhet",    "Bangladesh", "student"],
      ["2021331003", "Arif Mahmud",         "1999-11-05", "01812340003", "arif@student.sust.edu",     "Golapganj",       "Sylhet",      "Sylhet",    "Bangladesh", "student"],
      ["2021331004", "Riya Dey",            "2001-07-14", "01812340004", "riya@student.sust.edu",     "Sunamganj Sadar", "Sunamganj",   "Sylhet",    "Bangladesh", "student"],
      ["2021331005", "Tanvir Hasan",        "2000-09-30", "01812340005", "tanvir@student.sust.edu",   "Osmani Nagar",    "Sylhet",      "Sylhet",    "Bangladesh", "student"],
      ["2021331006", "Sadia Islam",         "2002-01-18", "01812340006", "sadia@student.sust.edu",    "Beanibazar",      "Sylhet",      "Sylhet",    "Bangladesh", "student"],
      ["2021331007", "Imran Khan",          "1999-04-25", "01812340007", "imran@student.sust.edu",    "Habiganj Sadar",  "Habiganj",    "Sylhet",    "Bangladesh", "student"],
      ["2021331008", "Farhan Chowdhury",    "2001-12-10", "01812340008", "farhan@student.sust.edu",   "Sylhet Sadar",    "Sylhet",      "Sylhet",    "Bangladesh", "student"],
      ["2021331009", "Meherun Nessa",       "2000-06-03", "01812340009", "meherun@student.sust.edu",  "Kanaighat",       "Sylhet",      "Sylhet",    "Bangladesh", "student"],
      ["2021331010", "Sabbir Hossen",       "2001-08-19", "01812340010", "sabbir@student.sust.edu",   "Companiganj",     "Sylhet",      "Sylhet",    "Bangladesh", "student"],
      // teachers
      ["TCH001",     "Prof. Dr. M. Alam",   "1970-07-18", "01912340001", "alam@sust.edu",             "Sylhet Sadar",    "Sylhet",      "Sylhet",    "Bangladesh", "teacher"],
      ["TCH002",     "Dr. Fatema Begum",    "1975-09-25", "01912340002", "fatema@sust.edu",           "Shahporan",       "Sylhet",      "Sylhet",    "Bangladesh", "teacher"],
      ["TCH003",     "Dr. Iqbal Hussain",   "1968-02-11", "01912340003", "iqbal@sust.edu",            "Moulvibazar",     "Moulvibazar", "Sylhet",    "Bangladesh", "teacher"],
      // officers
      ["OFF001",     "Mr. Kamal Hosen",     "1985-01-30", "01612340001", "kamal@sust.edu",            "Sylhet Sadar",    "Sylhet",      "Sylhet",    "Bangladesh", "officer"],
      ["OFF002",     "Ms. Rowshan Ara",     "1988-06-22", "01612340002", "rowshan@sust.edu",          "Zakiganj",        "Sylhet",      "Sylhet",    "Bangladesh", "officer"],
    ];

    for (const p of persons) {
      await conn.query(
        `INSERT IGNORE INTO Person
           (person_id,fullname,date_of_birth,contact_number,email,upazilla,district,division,country,type)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        p,
      );
    }
    console.log("✅  Persons inserted");

    // ── 5. Medical Card Applications ─────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO MedicalCardApplication
        (ApplicationDate,ApplicationStatus,PhotoUrl,IdCardUrl,ReviewDate,ReviewerId,ReviewerComments,ApprovedBy,ApprovedDate,PersonID)
      VALUES
        ('2023-01-10','Approved',NULL,NULL,'2023-01-12','ADM001','All documents verified','ADM001','2023-01-12','2021331001'),
        ('2023-02-05','Approved',NULL,NULL,'2023-02-07','ADM001','Approved',              'ADM001','2023-02-07','2021331002'),
        ('2023-03-15','Approved',NULL,NULL,'2023-03-17','ADM001','Approved',              'ADM001','2023-03-17','2021331003'),
        ('2023-04-20','Approved',NULL,NULL,'2023-04-22','ADM001','Approved',              'ADM001','2023-04-22','TCH001'),
        ('2023-05-10','Approved',NULL,NULL,'2023-05-12','ADM001','Approved',              'ADM001','2023-05-12','TCH002'),
        ('2023-06-01','Approved',NULL,NULL,'2023-06-03','ADM001','Approved',              'ADM001','2023-06-03','OFF001'),
        ('2023-07-05','Approved',NULL,NULL,'2023-07-07','ADM001','Approved',              'ADM001','2023-07-07','2021331004'),
        ('2023-07-08','Approved',NULL,NULL,'2023-07-10','ADM001','Approved',              'ADM001','2023-07-10','2021331005'),
        ('2023-08-01','Approved',NULL,NULL,'2023-08-03','ADM002','All clear',             'ADM002','2023-08-03','2021331006'),
        ('2023-08-15','Approved',NULL,NULL,'2023-08-17','ADM002','Approved',              'ADM002','2023-08-17','2021331007'),
        ('2023-09-01','Approved',NULL,NULL,'2023-09-03','ADM002','Approved',              'ADM002','2023-09-03','TCH003'),
        ('2023-09-10','Approved',NULL,NULL,'2023-09-12','ADM002','Approved',              'ADM002','2023-09-12','OFF002'),
        -- Pending application
        ('2025-01-15','Pending', NULL,NULL,NULL,         NULL,   NULL,                   NULL,    NULL,       '2021331008'),
        -- Rejected application
        ('2025-01-10','Rejected',NULL,NULL,'2025-01-12','ADM001','Photo unclear, resubmit',NULL, NULL,       '2021331009')
    `);
    console.log("✅  Medical card applications inserted");

    // ── 6. Medical Cards ──────────────────────────────────────────────────────
    const cards = [
      // [CardID, IssueDate, ExpiryDate, Status, PersonID, Height_cm, Weight_kg, BloodGroup, PasswordHash]
      ["MC2023001", "2023-01-12", "2026-01-12", "Active",  "2021331001", 170.5, 65.0,  "B+",  PATIENT_PASS],
      ["MC2023002", "2023-02-07", "2026-02-07", "Active",  "2021331002", 155.0, 50.0,  "O+",  PATIENT_PASS],
      ["MC2023003", "2023-03-17", "2026-03-17", "Active",  "2021331003", 168.0, 70.0,  "A+",  PATIENT_PASS],
      ["MC2023004", "2023-04-22", "2026-04-22", "Active",  "TCH001",     175.0, 80.0,  "AB+", PATIENT_PASS],
      ["MC2023005", "2023-05-12", "2026-05-12", "Active",  "TCH002",     162.0, 58.0,  "B-",  PATIENT_PASS],
      ["MC2023006", "2023-06-03", "2026-06-03", "Active",  "OFF001",     172.0, 72.0,  "O-",  PATIENT_PASS],
      ["MC2023007", "2023-07-07", "2026-07-07", "Active",  "2021331004", 158.0, 52.0,  "A-",  PATIENT_PASS],
      ["MC2023008", "2023-07-10", "2026-07-10", "Active",  "2021331005", 175.0, 75.0,  "O+",  PATIENT_PASS],
      ["MC2023009", "2023-08-03", "2026-08-03", "Active",  "2021331006", 161.0, 54.0,  "AB-", PATIENT_PASS],
      ["MC2023010", "2023-08-17", "2026-08-17", "Active",  "2021331007", 178.0, 82.0,  "B+",  PATIENT_PASS],
      ["MC2023011", "2023-09-03", "2026-09-03", "Active",  "TCH003",     180.0, 85.0,  "A+",  PATIENT_PASS],
      ["MC2023012", "2023-09-12", "2026-09-12", "Active",  "OFF002",     163.0, 60.0,  "O+",  PATIENT_PASS],
    ];

    for (const c of cards) {
      await conn.query(
        `INSERT IGNORE INTO MedicalCard
           (CardID,IssueDate,ExpiryDate,Status,PersonID,Height_cm,Weight_kg,BloodGroup,PasswordHash)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        c,
      );
    }
    console.log("✅  Medical cards inserted");

    // ── 7. Medicines (from bdsm_medicine_list.pdf — real SUST pharmacy stock) ─
    await conn.query(`
      INSERT IGNORE INTO medicine (name, generic_name, catagory) VALUES
      -- Analgesics / Antipyretics
      ('Ace 500',            'Paracetamol',                  'Analgesic/Antipyretic'),
      ('Preservin 100mg',    'Aceclofenac',                  'Analgesic/Antipyretic'),
      ('Clofenac 50',        'Diclofenac',                   'Analgesic/NSAID'),
      ('Ace Plus',           'Paracetamol+Caffeine',         'Analgesic/Antipyretic'),
      ('Norvis',             'Timmoneum Methylsulfate',      'Antispasmodic'),
      -- Antibiotics
      ('Romycin 500',        'Azithromycin',                 'Antibiotic'),
      ('Trevox 500',         'Levofloxacin',                 'Antibiotic'),
      ('Phylopen DS',        'Flucloxacillin',               'Antibiotic'),
      ('Quinox 500',         'Ciprofloxacin',                'Antibiotic'),
      ('Lebac 500',          'Cephradine',                   'Antibiotic'),
      -- Anti-Ulcerant / Antacid
      ('Entacyd Plus',       'Antacid Suspension',           'Antacid'),
      ('Famotac 20',         'Famotidine',                   'H2 Blocker'),
      ('Esolok 20',          'Esomeprazole',                 'Proton Pump Inhibitor'),
      ('Seclo 20',           'Omeprazole',                   'Proton Pump Inhibitor'),
      -- Antihistamines
      ('Loratin 10',         'Loratadine',                   'Antihistamine'),
      ('Alatrol 10',         'Cetirizine',                   'Antihistamine'),
      ('Fexo 120',           'Fexofenadine',                 'Antihistamine'),
      -- Anti-Emetic
      ('Motigut 10',         'Domperidone',                  'Anti-Emetic'),
      ('Ofran 8',            'Ondansetron',                  'Anti-Emetic'),
      -- Vitamins
      ('Ceevit',             'Ascorbic Acid',                'Vitamin'),
      ('B 50 Forte',         'Vitamin B Complex',            'Vitamin'),
      ('Riboson',            'Riboflavin',                   'Vitamin'),
      -- Antifungal
      ('Flugal 50',          'Fluconazole',                  'Antifungal'),
      -- Anti-Diarrheal / Anti-Amoebic
      ('Amodis 400',         'Metronidazole',                'Antiprotozoal'),
      ('ORS',                'Oral Rehydration Salts',       'Electrolyte'),
      ('Zox 500',            'Nitazoxanide',                 'Anti-Diarrheal'),
      ('Alben DS',           'Albendazole',                  'Anthelmintic'),
      -- Anti-Asthmatic / Respiratory
      ('Sultolin SR',        'Salbutamol',                   'Bronchodilator'),
      ('Montene 10',         'Montelukast',                  'Anti-Asthmatic'),
      ('Windel Plus',        'Salbutamol Nebuliser',         'Bronchodilator'),
      ('Ambroxol Syp',       'Ambroxol',                     'Mucolytic'),
      -- Calcium
      ('Calbo 500',          'Calcium Carbonate',            'Mineral Supplement'),
      -- Creams / Ointments
      ('Betameson N',        'Betamethasone',                'Topical Corticosteroid'),
      ('Donadin Cream',      'Povidone Iodine',              'Antiseptic'),
      ('Bactrocin Oint',     'Mupirocin',                    'Topical Antibiotic'),
      ('Terbinox',           'Terbinafine',                  'Topical Antifungal'),
      ('Fungidal HC',        'Miconazole',                   'Topical Antifungal'),
      ('Voligel',            'Diclofenac Gel',               'Topical NSAID'),
      ('Burnsil Cream',      'Silver Sulfadiazine',          'Burn Treatment'),
      ('Scarin Cream',       'Permethrin',                   'Scabicide'),
      -- Drops
      ('Sq Mycetin',         'Chloramphenicol',              'Eye/Ear Drop'),
      ('Antazole N Drop',    'Xylometazoline',               'Nasal Decongestant'),
      -- Anti-Hypertensive / Anxiolytic
      ('Camlodine 5',        'Amlodipine',                   'Anti-Hypertensive'),
      -- Injections / Powder
      ('Nebanol Powder',     'Bacitracin',                   'Topical Antibiotic Powder'),
      ('T T Inj',            'Tetanus Toxoid',               'Vaccine'),
      ('Seclo 40 Inj',       'Omeprazole Injection',         'Proton Pump Inhibitor Inj'),
      ('Emistat Inj',        'Ondansetron Injection',        'Anti-Emetic Inj'),
      ('Dexonex Inj',        'Dexamethasone Injection',      'Corticosteroid Inj'),
      ('Norvis Inj',         'Timonium Sulphate Inj',        'Antispasmodic Inj'),
      ('Clofenac Inj',       'Diclofenac Injection',         'NSAID Inj')
    `);
    console.log("✅  Medicines inserted");

    // ── 8. Inventory batches (aligned with real PDF quantities) ───────────────
    // medicine_id auto-increment starts at 1, matches INSERT order above
    const inventoryBatches = [
      // [medicine_id, quantity, exp_date]
      [1,  17000, "2026-10-31"],  // Ace 500 (Paracetamol)
      [2,  1750,  "2026-09-30"],  // Preservin
      [3,  1800,  "2027-06-30"],  // Clofenac 50
      [4,  9800,  "2026-12-31"],  // Ace Plus
      [5,  1550,  "2026-09-30"],  // Norvis
      [6,  3040,  "2027-11-30"],  // Romycin
      [7,  480,   "2027-08-31"],  // Trevox
      [8,  7194,  "2027-02-28"],  // Phylopen DS
      [9,  1120,  "2029-06-30"],  // Quinox
      [10, 1830,  "2026-07-31"],  // Lebac
      [11, 1200,  "2026-07-31"],  // Entacyd Plus
      [12, 2700,  "2026-06-30"],  // Famotac
      [13, 8000,  "2027-02-28"],  // Esolok
      [14, 3000,  "2027-01-31"],  // Seclo 20
      [15, 6300,  "2028-01-31"],  // Loratin
      [16, 5100,  "2027-01-31"],  // Alatrol
      [17, 5850,  "2027-01-31"],  // Fexo
      [18, 12100, "2027-01-31"],  // Motigut
      [19, 1170,  "2027-02-28"],  // Ofran
      [20, 4750,  "2027-06-30"],  // Ceevit
      [21, 1750,  "2026-09-30"],  // B 50 Forte
      [22, 500,   "2026-02-28"],  // Riboson
      [23, 600,   "2027-06-30"],  // Flugal
      [24, 3120,  "2027-06-30"],  // Amodis
      [25, 800,   "2028-02-28"],  // ORS
      [26, 480,   "2027-06-30"],  // Zox
      [27, 400,   "2026-05-31"],  // Alben DS
      [28, 800,   "2027-07-31"],  // Sultolin SR
      [29, 7920,  "2027-11-30"],  // Montene
      [30, 192,   "2027-09-30"],  // Windel Plus
      [31, 452,   "2028-04-30"],  // Ambroxol Syp
      [32, 1700,  "2026-09-30"],  // Calbo
      [33, 89,    "2027-03-31"],  // Betameson N
      [34, 78,    "2027-07-31"],  // Donadin Cream
      [35, 10,    "2027-06-30"],  // Bactrocin
      [36, 314,   "2027-02-28"],  // Terbinox
      [37, 95,    "2028-04-30"],  // Fungidal HC
      [38, 45,    "2026-12-31"],  // Voligel
      [39, 16,    "2025-01-31"],  // Burnsil (near expired/expired — kept for realism)
      [40, 285,   "2027-03-31"],  // Scarin
      [41, 45,    "2026-06-30"],  // Sq Mycetin
      [42, 144,   "2026-06-30"],  // Antazole
      [43, 60,    "2026-09-30"],  // Camlodine
      [44, 60,    "2027-12-31"],  // Nebanol Powder
      [45, 30,    "2027-11-30"],  // TT Inj
      [46, 4,     "2026-06-30"],  // Seclo 40 Inj
      [47, 6,     "2027-05-31"],  // Emistat Inj
      [48, 7,     "2026-06-30"],  // Dexonex Inj
      [49, 10,    "2026-05-31"],  // Norvis Inj
      [50, 8,     "2025-10-31"],  // Clofenac Inj (expired — kept for realism)
    ];

    for (const [mid, qty, exp] of inventoryBatches) {
      await conn.query(
        `INSERT INTO medicine_inventory (medicine_id, quantity, added_at, exp_date)
         VALUES (?, ?, NOW(), ?)`,
        [mid, qty, exp],
      );
    }
    console.log("✅  Inventory batches inserted");

    // ── 9. Medicine Transactions (IN — initial stock receipt) ─────────────────
    const initStock = [
      [1,17000],[2,1750],[3,1800],[4,9800],[5,1550],
      [6,3040],[7,480],[8,7194],[9,1120],[10,1830],
      [11,1200],[12,2700],[13,8000],[14,3000],[15,6300],
      [16,5100],[17,5850],[18,12100],[19,1170],[20,4750],
      [21,1750],[22,500],[23,600],[24,3120],[25,800],
      [26,480],[27,400],[28,800],[29,7920],[30,192],
      [31,452],[32,1700],[33,89],[34,78],[35,10],
      [36,314],[37,95],[38,45],[39,16],[40,285],
      [41,45],[42,144],[43,60],[44,60],[45,30],
      [46,4],[47,6],[48,7],[49,10],[50,8],
    ];

    for (const [mid, qty] of initStock) {
      await conn.query(
        `INSERT INTO medicine_transaction
           (medicine_id, transaction_type, quantity, made_by, transaction_date, reference_type, reference_id, balance_after)
         VALUES (?, 'IN', ?, 'REG001', '2025-07-01 08:00:00', 'Initial Stock', 'INIT-2025', ?)`,
        [mid, qty, qty],
      );
    }
    console.log("✅  Initial stock transactions inserted");

    // ── 10. Outdoor Visits ────────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO outdoor_visit (card_id, doctor_id, visit_date, visit_type) VALUES
      ('MC2023001','DOC001','2024-11-01 09:30:00','First Visit'),
      ('MC2023002','DOC001','2024-11-02 10:00:00','First Visit'),
      ('MC2023003','DOC002','2024-11-05 11:15:00','First Visit'),
      ('MC2023004','DOC001','2024-11-10 09:00:00','Follow-up'),
      ('MC2023001','DOC002','2024-11-15 14:30:00','Follow-up'),
      ('MC2023005','DOC001','2024-12-01 08:45:00','First Visit'),
      ('MC2023006','DOC003','2024-12-03 10:00:00','First Visit'),
      ('MC2023007','DOC001','2024-12-05 09:15:00','First Visit'),
      ('MC2023008','DOC002','2024-12-08 11:00:00','Emergency'),
      ('MC2023009','DOC003','2024-12-10 14:00:00','First Visit'),
      ('MC2023010','DOC004','2024-12-12 09:30:00','First Visit'),
      ('MC2023011','DOC001','2024-12-15 10:45:00','Follow-up'),
      ('MC2023012','DOC002','2025-01-05 09:00:00','First Visit'),
      ('MC2023001','DOC003','2025-01-10 11:30:00','Follow-up'),
      ('MC2023003','DOC004','2025-01-15 14:00:00','First Visit')
    `);
    console.log("✅  Outdoor visits inserted");

    // ── 11. Prescriptions ─────────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO prescription (visit_id, symptoms, advice, created_at) VALUES
      (1,  'Headache and mild fever',                      'Rest, drink water, avoid screen time',            '2024-11-01 09:35:00'),
      (2,  'Sore throat and cough for 3 days',            'Warm gargling, avoid cold drinks, steam inhale',  '2024-11-02 10:10:00'),
      (3,  'Stomach pain, nausea, loose stool',            'Light diet, avoid oily food, ORS frequently',     '2024-11-05 11:25:00'),
      (4,  'Lower back pain, worsens on standing',        'Physiotherapy recommended, avoid heavy lifting',   '2024-11-10 09:15:00'),
      (5,  'Itchy eyes, sneezing, runny nose',            'Avoid dust and pollen, wear mask outdoors',        '2024-11-15 14:40:00'),
      (6,  'Acidity, bloating, belching after meals',     'Eat small meals, avoid spicy and fried food',      '2024-12-01 08:55:00'),
      (7,  'Generalised weakness, fatigue for one week',  'Rest, multivitamin course, blood test advised',    '2024-12-03 10:10:00'),
      (8,  'Acute fever 103F, chills, body ache',         'Plenty of fluids, paracetamol every 6 hours',      '2024-12-05 09:20:00'),
      (9,  'Severe abdominal pain, vomiting',             'IV fluids, NPO until pain subsides, urgent USG',   '2024-12-08 11:10:00'),
      (10, 'Persistent cough, chest tightness',           'Bronchodilator inhaler as needed, avoid smoke',    '2024-12-10 14:10:00'),
      (11, 'Skin rash, itching, scaling on forearm',      'Keep area clean and dry, avoid scratching',        '2024-12-12 09:45:00'),
      (12, 'Hypertension follow-up, BP 145/95',           'Continue medication, reduce salt, walk 30min/day', '2024-12-15 10:55:00'),
      (13, 'Menstrual irregularity and lower back pain', 'USG pelvis recommended, iron supplementation',      '2025-01-05 09:10:00'),
      (14, 'Recurrent headache, blurred vision',         'Check blood pressure, ophthalmology referral',      '2025-01-10 11:40:00'),
      (15, 'Fungal infection between toes',               'Keep feet dry, change socks daily, antifungal',     '2025-01-15 14:10:00')
    `);
    console.log("✅  Prescriptions inserted");

    // ── 12. Medications (prescription → medicine mappings) ────────────────────
    await conn.query(`
      INSERT IGNORE INTO medication (prescription_id, medicine_id, dosage_amount, dosage_unit, duration_day, frequency) VALUES
      -- Visit 1: Headache / fever → Paracetamol, Vitamin C
      (1,  1,  500, 'mg', 5, 3),
      (1,  20,  500, 'mg', 7, 1),
      -- Visit 2: Sore throat → Azithromycin, Paracetamol
      (2,  6,  500, 'mg', 5, 1),
      (2,  1,  500, 'mg', 5, 3),
      -- Visit 3: Gastro → Metronidazole, ORS, Domperidone
      (3,  24, 400, 'mg', 7, 3),
      (3,  25,   1, 'unit', 5, 4),
      (3,  18,  10, 'mg', 5, 3),
      -- Visit 4: Back pain → Diclofenac, Diclofenac gel
      (4,  3,   50, 'mg', 5, 3),
      (4,  38,   1, 'unit', 7, 2),
      -- Visit 5: Allergy → Cetirizine
      (5,  16,  10, 'mg', 7, 1),
      -- Visit 6: Acidity → Omeprazole, Antacid
      (6,  14,  20, 'mg', 7, 1),
      (6,  11,  10, 'ml', 5, 3),
      -- Visit 7: Fatigue → B-Complex, Ascorbic Acid
      (7,  21,   1, 'unit', 30, 1),
      (7,  20, 500, 'mg', 30, 1),
      -- Visit 8: High fever → Paracetamol, Azithromycin
      (8,  1,  500, 'mg', 5, 4),
      (8,  6,  500, 'mg', 5, 1),
      -- Visit 9: Abdominal pain / vomiting → Ondansetron, Domperidone
      (9,  19,   8, 'mg', 3, 3),
      (9,  18,  10, 'mg', 5, 3),
      -- Visit 10: Cough / asthma → Salbutamol, Ambroxol, Montelukast
      (10, 28,   1, 'unit', 10, 2),
      (10, 31,  10, 'ml',  7,  3),
      (10, 29,  10, 'mg',  14, 1),
      -- Visit 11: Skin rash → Cetirizine, Terbinafine cream
      (11, 16,  10, 'mg', 7, 1),
      (11, 36,   1, 'unit', 14, 2),
      -- Visit 12: Hypertension → Amlodipine
      (12, 43,   5, 'mg', 30, 1),
      -- Visit 13: Menstrual issues → Iron (B-complex proxy), ORS
      (13, 21,   1, 'unit', 30, 1),
      -- Visit 14: Headache → Aceclofenac, Vitamin C
      (14, 2,  100, 'mg', 5, 2),
      (14, 20, 500, 'mg', 7, 1),
      -- Visit 15: Fungal → Fluconazole, Terbinafine
      (15, 23,  50, 'mg', 14, 1),
      (15, 36,   1, 'unit', 14, 2)
    `);
    console.log("✅  Medications inserted");

    // ── 13. Tokens ────────────────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO token (visit_id, issued_time, status) VALUES
      (1,  '2024-11-01 09:36:00', 'Consumed'),
      (2,  '2024-11-02 10:11:00', 'Consumed'),
      (3,  '2024-11-05 11:26:00', 'Consumed'),
      (4,  '2024-11-10 09:16:00', 'Consumed'),
      (5,  '2024-11-15 14:41:00', 'Consumed'),
      (6,  '2024-12-01 08:56:00', 'Consumed'),
      (7,  '2024-12-03 10:11:00', 'Consumed'),
      (8,  '2024-12-05 09:21:00', 'Consumed'),
      (9,  '2024-12-08 11:11:00', 'Consumed'),
      (10, '2024-12-10 14:11:00', 'Pending'),
      (11, '2024-12-12 09:46:00', 'Pending'),
      (12, '2024-12-15 10:56:00', 'Pending'),
      (13, '2025-01-05 09:11:00', 'Pending'),
      (14, '2025-01-10 11:41:00', 'Pending'),
      (15, '2025-01-15 14:11:00', 'Pending')
    `);
    console.log("✅  Tokens inserted");

    // ── 14. Dispensations (tokens 1-9 fulfilled) ──────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO medicine_dispensation
        (token_id, medicine_id, quantity_dispensed, dispensed_by, dispensed_time) VALUES
      -- token 1: Paracetamol + Vit C
      (1, 1,  45, 'NUR001', '2024-11-01 09:50:00'),
      (1, 20, 14, 'NUR001', '2024-11-01 09:51:00'),
      -- token 2: Azithromycin + Paracetamol
      (2, 6,   5, 'NUR001', '2024-11-02 10:25:00'),
      (2, 1,  45, 'NUR001', '2024-11-02 10:26:00'),
      -- token 3: Metronidazole + ORS + Domperidone
      (3, 24, 42, 'NUR002', '2024-11-05 11:40:00'),
      (3, 25,  5, 'NUR002', '2024-11-05 11:41:00'),
      (3, 18, 15, 'NUR002', '2024-11-05 11:42:00'),
      -- token 4: Diclofenac + gel
      (4, 3,  15, 'NUR002', '2024-11-10 09:30:00'),
      (4, 38,  1, 'NUR002', '2024-11-10 09:31:00'),
      -- token 5: Cetirizine
      (5, 16,  7, 'NUR001', '2024-11-15 14:55:00'),
      -- token 6: Omeprazole + Antacid
      (6, 14,  7, 'NUR001', '2024-12-01 09:10:00'),
      (6, 11, 15, 'NUR001', '2024-12-01 09:11:00'),
      -- token 7: B-Complex + Vit C
      (7, 21, 30, 'NUR003', '2024-12-03 10:25:00'),
      (7, 20, 30, 'NUR003', '2024-12-03 10:26:00'),
      -- token 8: Paracetamol + Azithromycin
      (8, 1,  20, 'NUR003', '2024-12-05 09:35:00'),
      (8, 6,   5, 'NUR003', '2024-12-05 09:36:00'),
      -- token 9: Ondansetron + Domperidone (partial — Ondansetron limited stock)
      (9, 19,  4, 'NUR001', '2024-12-08 11:25:00'),
      (9, 18,  9, 'NUR001', '2024-12-08 11:26:00')
    `);
    console.log("✅  Dispensations inserted  (tokens 10-15 pending)");

    // ── 15. Substore Requisitions ─────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO substore_requisition (requisition_id, made_by, created_at, status) VALUES
      ('REQ2024-001', 'NUR001', '2024-12-01 17:00:00', 'Processed'),
      ('REQ2024-002', 'NUR001', '2024-12-08 17:00:00', 'Processed'),
      ('REQ2025-001', 'NUR001', '2025-01-10 17:00:00', 'Pending')
    `);

    await conn.query(`
      INSERT IGNORE INTO requisition_item (requisition_id, medicine_id, quantity) VALUES
      -- REQ2024-001
      ('REQ2024-001', 1,  500),
      ('REQ2024-001', 6,  100),
      ('REQ2024-001', 14,  50),
      ('REQ2024-001', 16,  50),
      -- REQ2024-002
      ('REQ2024-002', 24, 200),
      ('REQ2024-002', 25, 100),
      ('REQ2024-002', 18, 100),
      -- REQ2025-001
      ('REQ2025-001', 1,  300),
      ('REQ2025-001', 29, 100),
      ('REQ2025-001', 28,  50)
    `);
    console.log("✅  Requisitions inserted");

    // ── 16. First Aid Requests ────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO first_aid_request
        (request_id, requested_by, trip_details, document_url, request_date, approved_by, statue)
      VALUES
        ('FAR2024-001','MC2023001',"Cox's Bazar study tour — 50 students, 3 days, Dept of CSE",    NULL,'2024-11-25','REG001','APPROVED'),
        ('FAR2024-002','MC2023002','Srimangal eco-tour — 30 students, 2 days, Dept of EEE',        NULL,'2024-12-10',NULL,    'PENDING'),
        ('FAR2025-001','MC2023005','Lawachara forest trip — 40 students, 1 day, Dept of CEE',       NULL,'2025-01-08','ADM001','APPROVED'),
        ('FAR2025-002','MC2023007','Ratargul swamp tour — 25 students, 1 day, Dept of Physics',    NULL,'2025-01-20',NULL,    'PENDING')
    `);

    await conn.query(`
      INSERT IGNORE INTO first_aid_item (request_id, medicine_id, quantity) VALUES
      -- FAR2024-001 (50 students, 3 days)
      ('FAR2024-001', 1,  150),
      ('FAR2024-001', 25,  50),
      ('FAR2024-001', 16,  50),
      ('FAR2024-001', 3,   50),
      ('FAR2024-001', 18,  30),
      -- FAR2024-002 (30 students, 2 days) — pending
      ('FAR2024-002', 1,   90),
      ('FAR2024-002', 25,  30),
      ('FAR2024-002', 16,  30),
      -- FAR2025-001 (40 students, 1 day)
      ('FAR2025-001', 1,   80),
      ('FAR2025-001', 25,  40),
      ('FAR2025-001', 6,   40),
      ('FAR2025-001', 34,   5),
      -- FAR2025-002 (25 students, 1 day) — pending
      ('FAR2025-002', 1,   50),
      ('FAR2025-002', 25,  25),
      ('FAR2025-002', 18,  15)
    `);
    console.log("✅  First aid requests inserted");

    // ── 17. Ambulance Logs ────────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO ambulance_log
        (patient_id, driver_id, pickup_location, departure_time, return_time, destination)
      VALUES
      ('MC2023001','DRV001','Shahjalal Hall Gate',           '2024-10-10 02:15:00','2024-10-10 03:45:00','Sylhet MAG Osmani Medical College'),
      ('MC2023003','DRV001','Taltala Residential Area',      '2024-11-20 14:00:00','2024-11-20 15:30:00','Mount Adora Hospital, Sylhet'),
      ('MC2023002','DRV002','Mujib Hall Gate',               '2024-12-05 10:30:00','2024-12-05 12:00:00','Sylhet MAG Osmani Medical College'),
      ('MC2023008','DRV001','Female Dormitory Entrance',     '2024-12-08 23:00:00','2024-12-09 01:00:00','Ibn Sina Hospital, Sylhet'),
      ('MC2023004','DRV002','Faculty Residential Quarter',   '2025-01-03 16:30:00','2025-01-03 17:45:00','Sylhet MAG Osmani Medical College'),
      ('MC2023010','DRV001','Gymnasium Road',                '2025-01-12 08:00:00', NULL,                'Mount Adora Hospital, Sylhet')
    `);
    console.log("✅  Ambulance logs inserted  (log 6 trip in progress)");

    // ── 18. Rosters (two 15-day cycles) ──────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO roster
        (employee_id, duty_type, start_date, end_date, shift_start, shift_end, created_at, created_by, approved_by, status)
      VALUES
      -- Cycle 1: 2026-03-01 to 2026-03-15
      ('DOC001','Physical','2026-03-01','2026-03-15','08:00:00','14:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      ('DOC002','On Call', '2026-03-01','2026-03-15','14:00:00','20:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      ('DOC003','Physical','2026-03-01','2026-03-15','14:00:00','20:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      ('DOC004','On Call', '2026-03-01','2026-03-15','08:00:00','14:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      ('NUR001','Physical','2026-03-01','2026-03-15','08:00:00','16:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      ('NUR002','Physical','2026-03-01','2026-03-15','16:00:00','00:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      ('NUR003','On Call', '2026-03-01','2026-03-15','00:00:00','08:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      ('DRV001','Physical','2026-03-01','2026-03-15','00:00:00','08:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      ('DRV002','On Call', '2026-03-01','2026-03-15','08:00:00','16:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      ('REG001','Physical','2026-03-01','2026-03-15','08:00:00','16:00:00','2026-02-20 10:00:00','REG001','ADM001','Approved'),
      -- Cycle 2: 2026-03-16 to 2026-03-31 (draft — pending approval)
      ('DOC001','On Call', '2026-03-16','2026-03-31','14:00:00','20:00:00','2026-03-10 09:00:00','REG001',NULL,'Draft'),
      ('DOC002','Physical','2026-03-16','2026-03-31','08:00:00','14:00:00','2026-03-10 09:00:00','REG001',NULL,'Draft'),
      ('DOC003','On Call', '2026-03-16','2026-03-31','20:00:00','02:00:00','2026-03-10 09:00:00','REG001',NULL,'Draft'),
      ('DOC004','Physical','2026-03-16','2026-03-31','14:00:00','20:00:00','2026-03-10 09:00:00','REG001',NULL,'Draft'),
      ('NUR001','On Call', '2026-03-16','2026-03-31','16:00:00','00:00:00','2026-03-10 09:00:00','REG001',NULL,'Draft'),
      ('NUR002','Physical','2026-03-16','2026-03-31','08:00:00','16:00:00','2026-03-10 09:00:00','REG001',NULL,'Draft'),
      ('DRV001','On Call', '2026-03-16','2026-03-31','08:00:00','16:00:00','2026-03-10 09:00:00','REG001',NULL,'Draft'),
      ('DRV002','Physical','2026-03-16','2026-03-31','00:00:00','08:00:00','2026-03-10 09:00:00','REG001',NULL,'Draft')
    `);
    console.log("✅  Rosters inserted\n");

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉  SMCMS Seed Completed Successfully!

  ── STAFF (employee_id / Password@123) ──────────────────────
  Admin        ADM001  Md. Karim Uddin
  Admin        ADM002  Dr. Nasima Akhter
  Registrar    REG001  Ms. Sultana Akter
  Registrar    REG002  Mr. Habibur Rahman
  Doctor       DOC001  Dr. Arafat Hossain      (General Medicine)
  Doctor       DOC002  Dr. Nasrin Islam        (Gynecology)
  Doctor       DOC003  Dr. Saiful Alam         (Internal Medicine)
  Doctor       DOC004  Dr. Maliha Chowdhury    (Dermatology)
  Nurse        NUR001  Ms. Taslima Khanam
  Nurse        NUR002  Mr. Rafiqul Islam
  Nurse        NUR003  Ms. Sharmin Akter
  Driver       DRV001  Md. Jalal Uddin
  Driver       DRV002  Md. Sabbir Ahmed

  ── PATIENTS (CardID / Patient@123) ─────────────────────────
  MC2023001   Fahim Rahman        (student)
  MC2023002   Nusrat Jahan        (student)
  MC2023003   Arif Mahmud         (student)
  MC2023004   Prof. Dr. M. Alam   (teacher)
  MC2023005   Dr. Fatema Begum    (teacher)
  MC2023006   Mr. Kamal Hosen     (officer)
  MC2023007   Riya Dey            (student)
  MC2023008   Tanvir Hasan        (student)
  MC2023009   Sadia Islam         (student)
  MC2023010   Imran Khan          (student)
  MC2023011   Dr. Iqbal Hussain   (teacher)
  MC2023012   Ms. Rowshan Ara     (officer)

  ── SUMMARY ─────────────────────────────────────────────────
  Persons               : 15 (10 students, 3 teachers, 2 officers)
  Medical Cards         : 12 active  |  1 pending app  |  1 rejected app
  Medicines (catalogue) : 50 items from SUST pharmacy list
  Inventory Batches     : 50 batches
  Outdoor Visits        : 15  |  Prescriptions: 15  |  Tokens: 15
  Dispensations         : 18 records (tokens 1-9 served, 10-15 pending)
  Requisitions          : 3  (2 processed, 1 pending)
  First Aid Requests    : 4  (2 approved, 2 pending)
  Ambulance Logs        : 6  (5 completed, 1 in progress)
  Rosters               : 18 entries (10 approved cycle, 8 draft cycle)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  } catch (err) {
    console.error("❌  Seed error:", err.message);
    throw err;
  } finally {
    await conn.end();
  }
}

seed().catch(console.error);
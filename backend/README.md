# SUST Medical Centre — Backend API

## Project Structure

```
backend/
├── server.js                        # Entry point
├── package.json
├── .env.example                     # Copy to .env and configure
├── database/
│   └── seed.js                      # Seed all tables with demo data
└── src/
    ├── config/
    │   ├── db.js                    # MySQL connection pool
    │   └── jwt.js                   # JWT config (secret, expiry)
    ├── middleware/
    │   ├── auth.js                  # verifyToken + requireRole
    │   ├── errorHandler.js          # Global error handler
    │   └── validate.js              # Request body field validator
    ├── utils/
    │   ├── jwt.js                   # sign() / verify() helpers
    │   └── response.js              # Consistent JSON response helpers
    └── modules/
        ├── auth/                    # Login, getMe
        ├── admin/                   # Stats, employees, applications, rosters
        ├── doctor/                  # Visits, prescriptions, medicines
        ├── nurse/                   # Pending tokens, dispense
        ├── pharmacist/              # Medicine CRUD, inventory, transactions
        ├── patient/                 # Profile, visits, first-aid requests
        ├── driver/                  # Ambulance logs
        └── public/                  # Roster, employees, services (no auth)
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

# 3. Create database and run schema
# Run the SQL schema in your MySQL client first

# 4. Seed demo data
npm run seed

# 5. Start server
npm run dev       # development (nodemon)
npm start         # production
```

## API Routes

| Prefix              | Auth Required | Role          |
|---------------------|---------------|---------------|
| `POST /api/auth/login`   | ✗        | —             |
| `GET  /api/auth/me`      | ✓        | any           |
| `GET  /api/public/*`     | ✗        | —             |
| `GET  /api/admin/*`      | ✓        | Administrator |
| `GET  /api/doctor/*`     | ✓        | Doctor        |
| `GET  /api/nurse/*`      | ✓        | Nurse         |
| `GET  /api/pharmacist/*` | ✓        | Registrar     |
| `GET  /api/patient/*`    | ✓        | Patient       |
| `GET  /api/driver/*`     | ✓        | Driver        |

## Authentication

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

Login body:
```json
{
  "userType": "admin | doctor | nurse | pharmacist | driver | patient",
  "identifier": "ADM001",
  "password": "Password@123"
}
```

## Demo Credentials (after seed)

| Role        | userType    | identifier | password      |
|-------------|-------------|------------|---------------|
| Admin       | admin       | ADM001     | Password@123  |
| Pharmacist  | pharmacist  | REG001     | Password@123  |
| Doctor      | doctor      | DOC001     | Password@123  |
| Doctor      | doctor      | DOC002     | Password@123  |
| Nurse       | nurse       | NUR001     | Password@123  |
| Driver      | driver      | DRV001     | Password@123  |
| Patient     | patient     | MC2023001  | Patient@123   |
| Patient     | patient     | MC2023002  | Patient@123   |

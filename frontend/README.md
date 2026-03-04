# SUST Medical Centre — Frontend

A fully refactored, production-ready React frontend for the SUST Healthcare Management System.

## What Changed (Refactoring Summary)

### Architecture
- **React Router DOM v6** — replaces manual `window.history` / `popstate` routing
- **Lazy loading** — all pages loaded on demand via `React.lazy` + `Suspense`
- **Role-based protected routes** — each role has its own guarded route tree
- **Redirect on login/logout** — seamless navigation using `useNavigate`

### Component Splitting
Every large dashboard monolith was broken into focused components:

| Old File | New Components |
|---|---|
| `AdminDashboard.jsx` | `AdminStats`, `EmployeeTable`, `RosterManagement`, `ApplicationReviews` |
| `DoctorDashboard.jsx` | `DoctorVisits`, `MedicineList`, `MedicationRow` |
| `NurseDashboard.jsx` | `PendingTokens` |
| `PharmacistDashboard.jsx` | `MedicineInventory`, `TransactionHistory`, `PharmacistFirstAid` |
| `PatientDashboard.jsx` | `PatientProfile`, `PatientVisitHistory`, `FirstAidRequests` |
| `DriverDashboard.jsx` | `AmbulanceLogs` |

### Modern Hooks
- `useFetch(fn, deps)` — generic data fetching with loading/error state + refetch
- `useMutation(fn, opts)` — async mutation with toast feedback
- `useForm(initialValues)` — form state management
- `useDisclosure()` — modal/dialog open/close state

### Responsive Design
- Sidebar collapses on mobile with overlay
- Tables use `overflow-x-auto` wrappers, hide less critical columns on small screens
- Cards stack vertically on mobile, grid layout on wider screens
- Stats use 2-column on mobile, 4-column on desktop

### Backend Integration
- Single `api.js` service layer — all API calls in one file
- JWT token stored in `localStorage`, sent via `Authorization: Bearer` header
- `AuthContext` restores session from token on page reload via `/api/auth/me`
- Environment variable `VITE_API_URL` controls backend URL
- All forms call real APIs — no demo/mock data

## Project Structure

```
src/
├── App.jsx                    # Router + providers
├── main.jsx                   # Entry point
├── index.css                  # Tailwind + CSS variables
├── contexts/
│   └── AuthContext.jsx        # Auth state + session restore
├── hooks/
│   └── index.js               # useFetch, useMutation, useForm, useDisclosure
├── services/
│   └── api.js                 # All API calls
├── components/
│   ├── layout/
│   │   └── DashboardLayout.jsx  # Sidebar + responsive shell
│   ├── shared/
│   │   └── index.jsx           # LoadingSpinner, EmptyState, StatsCard, etc.
│   ├── admin/                  # AdminStats, EmployeeTable, RosterManagement, ApplicationReviews
│   ├── doctor/                 # DoctorVisits, MedicineList
│   ├── nurse/                  # PendingTokens
│   ├── pharmacist/             # MedicineInventory, TransactionHistory, PharmacistFirstAid
│   ├── patient/                # PatientProfile, PatientVisitHistory, FirstAidRequests
│   ├── driver/                 # AmbulanceLogs
│   └── ui/                     # shadcn/ui components (keep from original)
└── pages/
    ├── HomePage.jsx
    ├── LoginPage.jsx
    ├── admin/                  # One page per sidebar item
    ├── doctor/
    ├── nurse/
    ├── pharmacist/
    ├── patient/
    └── driver/
```

## Setup

### 1. Prerequisites
- Node.js 18+
- Your backend running on a known URL

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env — set VITE_API_URL to your backend URL
```

### 4. Copy UI components
Copy the `ui/` folder from your original project into `src/components/ui/`.
The shadcn/ui components are unchanged.

### 5. Run
```bash
npm run dev
```

## Backend API Contract

The frontend expects these endpoints:

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | `{ userType, identifier, password }` → `{ success, user, token }` |
| GET | `/api/auth/me` | Returns `{ user }` from JWT |

### Public
| GET | `/api/public/roster` | Active duty rosters |
| GET | `/api/public/employees` | Employee list |
| GET | `/api/public/services` | Services list |
| GET | `/api/public/info` | Medical centre contact/hours |

### Admin (requires Admin role)
| Method | Endpoint |
|---|---|
| GET | `/api/admin/stats` |
| GET | `/api/admin/employees` |
| GET/POST | `/api/admin/rosters` |
| PATCH | `/api/admin/rosters/:id/approve` |
| GET | `/api/admin/applications` |
| PATCH | `/api/admin/applications/:id/review` |

### Doctor
| GET | `/api/doctor/:id/visits` |
| POST | `/api/doctor/visits` |
| POST | `/api/doctor/prescriptions` |

### Patient
| GET | `/api/patient/:id/profile` |
| GET | `/api/patient/:id/visits` |
| GET/POST | `/api/patient/:id/first-aid` |

### Nurse
| GET | `/api/nurse/tokens/pending` |
| GET | `/api/nurse/prescription/:visitId` |
| POST | `/api/nurse/dispense` |

### Pharmacist
| GET/POST | `/api/pharmacist/medicines` |
| POST | `/api/pharmacist/inventory` |
| GET | `/api/pharmacist/transactions` |
| GET | `/api/pharmacist/first-aid` |
| PATCH | `/api/pharmacist/first-aid/:id` |

### Driver
| GET | `/api/driver/:id/logs` |
| POST | `/api/driver/logs` |
| PATCH | `/api/driver/logs/:id/complete` |

## User Roles & Default Routes

| Role | Default Dashboard |
|---|---|
| Patient | Profile card |
| Doctor | Patient visits |
| Nurse | Pending tokens |
| Pharmacist | Medicine inventory |
| Driver | Ambulance logs |
| Admin | Overview stats |

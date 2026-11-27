# CampusLoop – Smart Lost & Found Management System

A full-stack college campus **Lost & Found Management System** (B.Tech CSE Mini Project) built with **React, Vite, Tailwind CSS, Node.js, Express, and SQLite**. Students can report lost or found items with photos, discover potential matches via a **Smart Matching Algorithm**, receive real-time in-app notifications, and claim items through an **admin-verified handover workflow**.

---

## Key Features

- **Smart Matching Algorithm (TF-IDF + Multi-Factor Scoring):**
  Automatically compares newly posted items against opposite-type (`lost` ↔ `found`) open items using:
  - **Category Match (30%)** — exact & related category scoring
  - **Keyword Similarity (35%)** — TF-IDF cosine similarity + token Dice overlap + campus synonym normalization (`airpods` ↔ `earbuds`, `adapter` ↔ `charger`, `specs` ↔ `glasses`, etc.)
  - **Campus Location Similarity (20%)** — exact/building/token overlap
  - **Date Proximity (15%)** — time-decay scoring
  - Returns top 5 ranked matches with `%` confidence scores and match reasons, and triggers in-app notifications for high-confidence matches.
- **Role-Based Authentication (JWT + bcrypt):** Student & Admin accounts, protected routes, account suspension (block/unblock), profile editing, and password updates.
- **Admin-Verified Claim Flow:** Students submit ownership proof (text + optional receipt/photo + optional linked Lost report). Admins compare **Lost vs Found side by side**, add verification notes, and **Approve** (marks item as Returned & notifies both parties), **Reject**, or **Reset to Pending**.
- **In-App Notifications:** Navbar notification bell with unread badge, clickable deep links, individual mark-as-read, and mark-all-as-read.
- **Rich Browse & Search:** Debounced search, Lost/Found toggle, category/location/status/date-range filters, newest/oldest sorting, and pagination.
- **Image Uploads:** Multer local storage (`/uploads`) with live previews plus client & server file-type (`JPG/PNG/WEBP/GIF`) and file-size (`5MB`) validation.
- **Admin Analytics Dashboard:** Left-sidebar `"Lost&Found Management System"` panel with stat cards, Recharts visualizations (*Items by Category* bar chart & *Lost vs Found* donut chart), Claims Management, and User Management.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, Vite 6, Tailwind CSS 4, React Router 6, Axios, Recharts, `lucide-react`, `react-hot-toast` |
| **Backend** | Node.js (v22.5+ / v24 built-in `node:sqlite`), Express 4, JWT (`jsonwebtoken`), `bcryptjs`, Multer, `express-validator` |
| **Database** | SQLite (`server/data/campusloop.db` — zero external DB setup required!) |

---

## Folder Structure

```text
├── package.json                  # Root convenience scripts
├── README.md
├── server/
│   ├── .env                      # Ready-to-run local environment config
│   ├── .env.example              # Environment variable template
│   ├── package.json
│   ├── data/                     # SQLite database file (campusloop.db)
│   ├── uploads/                  # Uploaded & seeded item/claim images
│   └── src/
│       ├── index.js              # Server entry point (auto-seeds if DB is empty)
│       ├── app.js                # Express app configuration & middleware
│       ├── seed.js               # Seed script (admin + 4 students + 13 items + 3 claims)
│       ├── config/
│       │   └── db.js             # SQLite connection & schema initialization
│       ├── middleware/
│       │   ├── auth.js           # JWT protect, optionalAuth, adminOnly
│       │   ├── upload.js         # Multer storage + type/size validation
│       │   ├── validate.js       # express-validator error formatter
│       │   └── errorHandler.js   # Centralized 404 & error handler
│       ├── models/
│       │   ├── User.js
│       │   ├── Item.js
│       │   ├── Claim.js
│       │   └── Notification.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── itemController.js
│       │   ├── claimController.js
│       │   ├── adminController.js
│       │   └── notificationController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── itemRoutes.js
│       │   ├── claimRoutes.js
│       │   ├── adminRoutes.js
│       │   └── notificationRoutes.js
│       └── utils/
│           ├── matcher.js        # Smart Matching Algorithm
│           └── generateSampleImages.js
└── client/
    ├── .env.example
    ├── index.html                # Inter font & metadata
    ├── vite.config.js            # Vite + Tailwind v4 + /api & /uploads proxy
    ├── public/
    │   └── campus-hero.svg       # Bundled college campus hero illustration
    └── src/
        ├── App.jsx               # Routes & layouts
        ├── api/axios.js          # Axios instance with JWT interceptor
        ├── context/AuthContext.jsx
        ├── constants/campusData.js
        ├── components/           # Navbar, Footer, ItemCard, StatusBadge, MatchCard, ClaimModal, AdminLayout, etc.
        └── pages/
            ├── Home.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── BrowseItems.jsx
            ├── ItemDetails.jsx
            ├── ReportItem.jsx
            ├── MyDashboard.jsx
            ├── Profile.jsx
            └── admin/
                ├── AdminDashboard.jsx
                ├── ClaimsManagement.jsx
                └── ManageUsers.jsx
```

---

## Setup & Run Locally

### Prerequisites
- **Node.js v22.5 or newer** (uses Node's built-in `node:sqlite`, so no external MongoDB/PostgreSQL installation is needed).

### 1. Install Dependencies
```bash
npm run install:all
```
*(Or manually run `npm install` inside both `server/` and `client/`.)*

### 2. Configure Environment Variables
A working `server/.env` is already provided (copied from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=campusloop_super_secret_jwt_key_change_in_production_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
DB_PATH=./data/campusloop.db
MAX_FILE_SIZE_MB=5
```

### 3. Seed Demo Data (Optional — Auto-runs on first server start)
```bash
npm run seed
```
This seeds 1 Admin user, 4 Student users, 13 realistic campus items (including Lost/Found pairs that immediately demonstrate Smart Matching), 3 sample claims (Pending, Approved, Rejected), and notifications.

### 4. Start Backend & Frontend
Open **two terminals** in the project root:

**Terminal 1 — Backend API (`http://localhost:5000`):**
```bash
npm run dev:server
```

**Terminal 2 — Frontend App (`http://localhost:5173`):**
```bash
npm run dev:client
```

Open **http://localhost:5173** in your browser!

> **Windows PowerShell note:** If PowerShell blocks `npm`, use `npm.cmd` (e.g., `npm.cmd run dev:server`) or run commands in Command Prompt / Git Bash.

---

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@campusloop.com` | `admin123` |
| **Student** | `abhishek@campusloop.com` | `student123` |
| **Student** | `priya@campusloop.com` | `student123` |

---

## REST API Endpoints

### Auth (`/api/auth`)
- `POST /api/auth/register` — Register a new student account
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/auth/me` — Get currently authenticated user
- `PUT /api/auth/profile` — Update name, phone, department
- `PUT /api/auth/password` — Change account password

### Items (`/api/items`)
- `GET /api/items/stats` — Public campus stats (total, lost, found, returned)
- `GET /api/items` — List items with filters (`type`, `category`, `location`, `status`, `search`, `dateFrom`, `dateTo`, `sort`, `page`, `limit`)
- `GET /api/items/my` — Current user's reported items & aggregated smart matches
- `GET /api/items/:id` — Single item details
- `GET /api/items/:id/matches` — Top 5 smart match suggestions with match scores
- `POST /api/items` — Create item report (`multipart/form-data`, up to 4 images)
- `PUT /api/items/:id` — Update item (owner or admin)
- `PATCH /api/items/:id/status` — Update item status (`open`, `claimed`, `returned`)
- `DELETE /api/items/:id` — Delete item (owner or admin)

### Claims (`/api/claims`)
- `POST /api/claims` — Submit ownership claim (`multipart/form-data` with optional `proofImage`)
- `GET /api/claims/my` — Current student's submitted claims
- `GET /api/claims` *(Admin)* — List all claims (filterable by `status`)
- `PATCH /api/claims/:id/status` *(Admin)* — Approve, reject, or reset claim to pending

### Admin (`/api/admin`)
- `GET /api/admin/stats` *(Admin)* — Dashboard stats, category breakdown, Lost vs Found ratio, recent activity
- `GET /api/admin/users` *(Admin)* — List users with search & role filters
- `PATCH /api/admin/users/:id` *(Admin)* — Block/unblock user or change role
- `DELETE /api/admin/users/:id` *(Admin)* — Delete user

### Notifications (`/api/notifications`)
- `GET /api/notifications` — List notifications & unread count
- `PATCH /api/notifications/:id/read` — Mark notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read


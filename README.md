# GigFlow — Smart Leads Dashboard

A full-stack leads management application built for the ServiceHive internship assignment. GigFlow lets teams capture, track, and manage sales leads with role-based access control, filtering, pagination, and CSV export.

---

## Features

### Authentication & Authorization
- JWT-based authentication with secure httpOnly handling
- Two roles: **Admin** (full access) and **Sales** (own leads only)
- Password hashing with bcrypt (12 salt rounds)
- Token expiry + auto-redirect on 401

### Leads Management
- Full CRUD: Create, Read, Update, Delete leads
- Lead fields: Name, Email, Status, Source, Notes
- Status flow: `New → Contacted → Qualified → Lost`
- Sources: `Website`, `Instagram`, `Referral`
- Role-based visibility: Sales reps only see leads they created

### Filtering & Search
- Real-time debounced search (name / email)
- Filter by Status and Source
- Sort by Latest / Oldest
- Server-side pagination (configurable limit)
- Active filter pills with one-click clear

### Dashboard
- Total leads count
- Breakdown by Status (New, Contacted, Qualified, Lost)
- Breakdown by Source (Website, Instagram, Referral)
- Conversion rate bar
- Progress bars with percentages

### Export
- CSV export respecting current filters
- Direct browser download

### UX
- Dark / Light mode (persisted in localStorage)
- Skeleton loaders during data fetching
- Toast notifications for all actions
- Responsive layout (desktop-first)
- Empty states with helpful messaging

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| State | Zustand (auth + theme), TanStack Query (server state) |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB with Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| DevOps | Docker, Docker Compose |

---

## Project Structure

```
GigFlow/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Auth & Lead controllers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/         # Mongoose User & Lead models
│   │   ├── routes/         # Express routers
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # JWT helper, response helper, seed
│   │   ├── validators/     # express-validator rules
│   │   ├── app.ts          # Express app
│   │   └── server.ts       # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios instance + auth/leads API
│   │   ├── components/
│   │   │   ├── auth/       # ProtectedRoute
│   │   │   ├── layout/     # Sidebar, Layout
│   │   │   ├── leads/      # LeadForm, LeadTable, LeadFiltersBar
│   │   │   └── ui/         # Button, Input, Select, Badge, Modal, Skeleton
│   │   ├── hooks/          # useDebounce
│   │   ├── pages/          # Login, Register, Dashboard, Leads
│   │   ├── store/          # Zustand: authStore, themeStore
│   │   └── types/          # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm 9+

### 1. Clone & install

```bash
git clone https://github.com/agniva1803/GigFlow.git
cd GigFlow
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api (default)
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. Seed demo data

```bash
cd backend
npm run seed
```

This creates:
- `admin@gigflow.com` / `admin123` (Admin role)
- `sales@gigflow.com` / `sales123` (Sales role)
- 10 sample leads

---

## Docker Setup

```bash
# From project root
cp .env.example .env
# Set JWT_SECRET in .env

docker-compose up --build
```

App available at `http://localhost`
API available at `http://localhost:5000`

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Leads
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/leads` | ✅ | Any | List leads (filters, pagination) |
| POST | `/api/leads` | ✅ | Any | Create lead |
| GET | `/api/leads/stats` | ✅ | Any | Dashboard stats |
| GET | `/api/leads/export/csv` | ✅ | Any | Export CSV |
| GET | `/api/leads/:id` | ✅ | Any | Get single lead |
| PUT | `/api/leads/:id` | ✅ | Owner/Admin | Update lead |
| DELETE | `/api/leads/:id` | ✅ | Owner/Admin | Delete lead |

### Query Params (GET /api/leads)
- `page` — page number (default: 1)
- `limit` — items per page (default: 10, max: 100)
- `status` — filter: New | Contacted | Qualified | Lost
- `source` — filter: Website | Instagram | Referral
- `search` — search by name or email
- `sort` — latest | oldest

---

## Database Schema

### User
```
name: String (required)
email: String (unique, required)
password: String (hashed, required)
role: 'admin' | 'sales' (default: sales)
```

### Lead
```
name: String (required)
email: String (required)
status: 'New' | 'Contacted' | 'Qualified' | 'Lost' (default: New)
source: 'Website' | 'Instagram' | 'Referral' (required)
notes: String (optional, max 500)
createdBy: ObjectId → User
assignedTo: ObjectId → User (optional)
```

---

## Design Decisions

- **Role-based data isolation**: Sales reps only see and manage their own leads, while admins have full visibility across all reps.
- **Server-side pagination**: All filtering, sorting, and pagination happens in MongoDB for performance at scale.
- **Optimistic UX**: TanStack Query handles caching and invalidation so the UI feels instant after mutations.
- **Debounced search**: 400ms debounce prevents excessive API calls during typing.
- **TypeScript throughout**: Strict TypeScript on both frontend and backend catches integration bugs at compile time.

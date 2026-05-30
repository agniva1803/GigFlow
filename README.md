<div align="center">

# ⚡ GigFlow — Smart Leads Dashboard

**Full-stack CRM for managing sales leads with role-based access, filters, and CSV export**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square)](https://render.com)

### 🔗 [Live Demo](https://gig-flow-mkbrj3ijl-agniva-mukherjees-projects-8ea5e944.vercel.app) · [Backend API](https://gigflow-kn78.onrender.com/health)

**Demo credentials:**
`admin@gigflow.com` / `admin123` (Admin) · `sales@gigflow.com` / `sales123` (Sales)

</div>

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based auth with secure token handling
- Two roles: **Admin** (full access) and **Sales** (own leads only)
- bcrypt password hashing (12 rounds)
- Auto-redirect on token expiry

### 📋 Leads Management
- Full CRUD — Create, Read, Update, Delete leads
- Status pipeline: `New → Contacted → Qualified → Lost`
- Sources: `Website`, `Instagram`, `Referral`
- Role-based visibility — sales reps only see their own leads

### 🔍 Filtering & Search
- Real-time debounced search (name / email)
- Filter by Status and Source
- Sort by Latest / Oldest
- Server-side pagination
- Active filter pills with one-click clear

### 📊 Dashboard
- Total leads counter
- Breakdown by Status and Source
- Conversion rate progress bar
- Live stats with 30s auto-refresh

### 📤 Export
- CSV export respecting active filters
- Direct browser download

### 🎨 UX
- Dark / Light mode (persisted)
- Skeleton loaders
- Toast notifications
- Fully responsive

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| State | Zustand (auth/theme), TanStack Query (server state) |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcryptjs |
| DevOps | Docker, Docker Compose, Nginx |
| Deploy | Vercel (frontend), Render (backend), MongoDB Atlas |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+, MongoDB (local or Atlas)

```bash
git clone https://github.com/agniva1803/GigFlow
cd GigFlow

# Backend
cd backend
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev        # runs on :5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev        # runs on :5173

# Seed demo data
cd backend && npm run seed
```

### Docker
```bash
cp .env.example .env
docker-compose up --build
# App at http://localhost
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Current user |

### Leads
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/leads` | Any | List with filters |
| POST | `/api/leads` | Any | Create lead |
| GET | `/api/leads/stats` | Any | Dashboard stats |
| GET | `/api/leads/export/csv` | Any | Export CSV |
| PUT | `/api/leads/:id` | Owner/Admin | Update |
| DELETE | `/api/leads/:id` | Owner/Admin | Delete |

**Query params:** `page`, `limit`, `status`, `source`, `search`, `sort`

---

## 📁 Project Structure

```
GigFlow/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Auth & Lead logic
│   │   ├── middleware/      # JWT, validation, errors
│   │   ├── models/         # User & Lead schemas
│   │   ├── routes/         # Express routers
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # JWT, response helpers, seed
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios + API functions
│   │   ├── components/     # UI, layout, leads components
│   │   ├── pages/          # Login, Register, Dashboard, Leads
│   │   └── store/          # Zustand stores
│   └── Dockerfile
├── docker-compose.yml
└── render.yaml
```

---

## 🔑 Environment Variables

**Backend `.env`:**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

---

<div align="center">

Built by <a href="https://github.com/agniva1803">Agniva Mukherjee</a> for the ServiceHive Full Stack Internship Assignment

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/agniva-mukherjee-b2647b21a)

</div>

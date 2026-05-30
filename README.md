# ⚑ GigFlow β€" Smart Leads Dashboard

[![Live Demo](https://img.shields.io/badge/πŸ"—_Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://gig-flow-mkbrj3ijl-agniva-mukherjees-projects-8ea5e944.vercel.app)
[![Backend](https://img.shields.io/badge/βš™οΈ_API-Render-purple?style=for-the-badge&logo=render)](https://gigflow-kn78.onrender.com/health)
[![GitHub](https://img.shields.io/badge/GitHub-agniva1803%2FGigFlow-181717?style=for-the-badge&logo=github)](https://github.com/agniva1803/GigFlow)

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-4EA94B?style=flat-square&logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker)

> A full-stack CRM leads management dashboard built as part of the **ServiceHive internship assignment**. Manage your sales pipeline with role-based access, smart filters, real-time stats, and CSV export.

---

## πŸ–₯️ Live Demo

πŸ"— **Frontend:** https://gig-flow-mkbrj3ijl-agniva-mukherjees-projects-8ea5e944.vercel.app

βš™οΈ **Backend API:** https://gigflow-kn78.onrender.com

> **Demo credentials:**
> | Role | Email | Password |
> |------|-------|----------|
> | Admin | `admin@gigflow.com` | `admin123` |
> | Sales | `sales@gigflow.com` | `sales123` |

---

## ✨ Features

### πŸ"' Authentication & Authorization
- JWT-based authentication with secure token handling
- Two roles: **Admin** (full access to all leads) and **Sales** (own leads only)
- Password hashing with bcrypt (12 salt rounds)
- Auto-redirect on token expiry

### πŸ"‹ Leads Management
- Full CRUD β€" Create, Read, Update, Delete leads
- Status flow: `New β†' Contacted β†' Qualified β†' Lost`
- Sources: `Website`, `Instagram`, `Referral`
- Role-based data isolation

### πŸ" Filtering & Search
- Real-time debounced search (name / email)
- Filter by Status and Source
- Sort by Latest / Oldest
- Server-side pagination with metadata
- Active filter pills with one-click clear

### πŸ"Š Dashboard
- Total leads count with gradient card
- Breakdown by Status with progress bars
- Breakdown by Source
- Conversion rate visualization

### πŸ"€ Export
- CSV export respecting current active filters
- Direct browser download

### 🎨 UX
- Dark / Light mode (persisted)
- Skeleton loaders
- Toast notifications
- Empty states with helpful messaging
- Fully responsive

---

## πŸ—οΈ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **State** | Zustand (auth + theme), TanStack Query (server state) |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB Atlas with Mongoose |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Validation** | express-validator |
| **DevOps** | Docker, Docker Compose, Nginx |
| **Hosting** | Vercel (frontend), Render (backend), MongoDB Atlas (DB) |

---

## πŸ" Project Structure

```
GigFlow/
β"œβ"€β"€ backend/
β"‚   β"œβ"€β"€ src/
β"‚   β"‚   β"œβ"€β"€ config/         # DB connection
β"‚   β"‚   β"œβ"€β"€ controllers/    # Auth & Lead controllers
β"‚   β"‚   β"œβ"€β"€ middleware/     # Auth, validation, error handling
β"‚   β"‚   β"œβ"€β"€ models/         # Mongoose User & Lead models
β"‚   β"‚   β"œβ"€β"€ routes/         # Express routers
β"‚   β"‚   β"œβ"€β"€ types/          # TypeScript interfaces
β"‚   β"‚   └── utils/          # JWT helper, response helper, seed
β"‚   └── Dockerfile
β"œβ"€β"€ frontend/
β"‚   β"œβ"€β"€ src/
β"‚   β"‚   β"œβ"€β"€ api/            # Axios instance + auth/leads API
β"‚   β"‚   β"œβ"€β"€ components/     # UI + layout + lead components
β"‚   β"‚   β"œβ"€β"€ pages/          # Login, Register, Dashboard, Leads
β"‚   β"‚   β"œβ"€β"€ store/          # Zustand stores
β"‚   β"‚   └── types/          # TypeScript interfaces
β"‚   └── Dockerfile
β"œβ"€β"€ docker-compose.yml
└── README.md
```

---

## πŸš€ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone
```bash
git clone https://github.com/agniva1803/GigFlow.git
cd GigFlow
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Runs on http://localhost:5173
```

### 4. Seed demo data
```bash
cd backend
npm run seed
```

---

## 🐳 Docker Setup

```bash
cp .env.example .env
docker-compose up --build
# App at http://localhost
# API at http://localhost:5000
```

---

## πŸ"' API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | βœ… | Get current user |

### Leads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads` | βœ… | List leads (filters, pagination) |
| POST | `/api/leads` | βœ… | Create lead |
| GET | `/api/leads/stats` | βœ… | Dashboard stats |
| GET | `/api/leads/export/csv` | βœ… | Export filtered CSV |
| GET | `/api/leads/:id` | βœ… | Get single lead |
| PUT | `/api/leads/:id` | βœ… | Update lead |
| DELETE | `/api/leads/:id` | βœ… | Delete lead |

### Query Params (GET /api/leads)
- `page` β€" page number (default: 1)
- `limit` β€" items per page (default: 10)
- `status` β€" New | Contacted | Qualified | Lost
- `source` β€" Website | Instagram | Referral
- `search` β€" search by name or email
- `sort` β€" latest | oldest

---

## 🎯 Design Decisions

- **Role-based data isolation** β€" Sales reps only see their own leads; admins see all
- **Server-side everything** β€" filtering, sorting, and pagination in MongoDB for scale
- **Optimistic UX** β€" TanStack Query caching makes mutations feel instant
- **Debounced search** β€" 400ms debounce prevents excessive API calls
- **TypeScript strict mode** β€" both frontend and backend catch bugs at compile time

---

## πŸ'¨β€πŸ'» Author

**Agniva Mukherjee**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/agniva-mukherjee-b2647b21a)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=flat-square&logo=vercel&logoColor=white)](https://my-portfolio-lime-ten-66.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/agniva1803)

---

## πŸ"„ License

MIT Β© 2024 Agniva Mukherjee

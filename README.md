# 🚀 TeamFlow — Team Task Manager

> A production-ready, full-stack collaborative task management application built for modern engineering teams.

![TeamFlow](https://img.shields.io/badge/status-production--ready-brightgreen)
![Node](https://img.shields.io/badge/node-18%2B-green)
![React](https://img.shields.io/badge/react-18-blue)
![MongoDB](https://img.shields.io/badge/mongodb-atlas-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

### Core
- 🔐 **JWT Authentication** — Secure login/signup with httpOnly cookies + bcrypt hashing
- 👥 **Role-Based Access Control** — Admin and Member roles with granular permissions
- 📁 **Project Management** — Create projects, invite members, track progress
- ✅ **Task Management** — Full CRUD with priorities, due dates, assignments
- 📊 **Analytics Dashboard** — Charts for completion rates, status, priority distribution
- 🗂️ **Kanban Board** — Drag-free column view with status swimlanes

### Bonus
- 🔔 **Notifications** — In-app bell for task assignments & project adds
- 📅 **Calendar View** — Monthly grid with task due dates
- 🔍 **Search & Filter** — Multi-dimensional filtering across all tasks
- 🧠 **Overdue Highlighting** — Smart red indicators for late tasks
- 📊 **Activity Log** — Full audit trail per project
- 🌙 **Dark Mode** — System-aware with manual toggle
- 📤 **CSV Export** — Download tasks filtered by project
- 🧪 **Backend Tests** — 18 test cases covering auth, projects, tasks

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Security | Helmet + rate-limiting |
| Testing | Jest + Supertest + mongodb-memory-server |
| Deployment | Railway (backend + frontend) |

---

## 📁 Folder Structure

```
teamflow/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Register, login, logout, profile
│   │   ├── projectController.js  # CRUD + member management
│   │   ├── taskController.js     # CRUD + CSV export + comments
│   │   └── dashboardController.js# Stats, charts, calendar data
│   ├── middleware/
│   │   ├── auth.js               # JWT protect, authorize, projectAdmin
│   │   ├── errorHandler.js       # Global error handler
│   │   └── validators.js         # express-validator rules
│   ├── models/
│   │   ├── User.js               # User schema + JWT + bcrypt methods
│   │   ├── Project.js            # Project schema + virtuals
│   │   ├── Task.js               # Task schema + hooks + indexes
│   │   └── Activity.js           # Audit log schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── dashboard.js
│   │   ├── notifications.js
│   │   └── activity.js
│   ├── tests/
│   │   └── api.test.js           # 18 integration tests
│   ├── utils/
│   │   ├── activity.js           # Activity log helper
│   │   └── sendToken.js          # Cookie token sender
│   ├── server.js                 # Express app entry point
│   ├── railway.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js          # Configured axios instance
│   │   │   └── index.js          # All API service functions
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx # Main shell + sidebar toggle
│   │   │   │   ├── Sidebar.jsx   # Navigation + user profile
│   │   │   │   └── TopBar.jsx    # Dark mode + notifications
│   │   │   ├── projects/
│   │   │   │   └── CreateProjectForm.jsx
│   │   │   ├── tasks/
│   │   │   │   ├── TaskCard.jsx  # Card with inline status toggle
│   │   │   │   └── TaskForm.jsx  # Create/edit form
│   │   │   └── shared/
│   │   │       ├── Modal.jsx
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── ToastContainer.jsx
│   │   │       └── index.jsx     # Avatar, Badge, EmptyState, ConfirmDialog
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # User state + login/logout
│   │   │   └── ThemeContext.jsx  # Dark mode state
│   │   ├── hooks/
│   │   │   └── index.js          # useFetch, useDebounce, useLocalStorage, useToast
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx # Charts + stats + activity
│   │   │   ├── ProjectsPage.jsx  # Project grid
│   │   │   ├── ProjectDetailPage.jsx # Board + list + members + activity tabs
│   │   │   ├── TasksPage.jsx     # Filterable task grid + export
│   │   │   ├── CalendarPage.jsx  # Monthly calendar view
│   │   │   ├── ProfilePage.jsx   # Edit profile + change password
│   │   │   └── NotFoundPage.jsx
│   │   ├── utils/
│   │   │   └── index.js          # Date helpers, config maps
│   │   ├── App.jsx               # Routes + providers
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind + CSS tokens + components
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── railway.toml
│   └── .env.example
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/teamflow.git
cd teamflow
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
# API running at http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
# App running at http://localhost:5173
```

### 4. Run Tests
```bash
cd backend
npm test
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/logout` | Private | Logout |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/update-profile` | Private | Update name/avatar |
| PUT | `/api/auth/change-password` | Private | Change password |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Private | Get user's projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Member | Get project details |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Owner/Admin | Delete project + tasks |
| POST | `/api/projects/:id/members` | Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Private | Get tasks (with filters) |
| POST | `/api/tasks` | Admin | Create task |
| GET | `/api/tasks/:id` | Member | Get task details |
| PUT | `/api/tasks/:id` | Admin/Assignee | Update task (member: status only) |
| DELETE | `/api/tasks/:id` | Admin | Delete task |
| POST | `/api/tasks/:id/comments` | Member | Add comment |
| GET | `/api/tasks/export` | Private | Export tasks as CSV |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard/stats` | Private | Stats + chart data |
| GET | `/api/dashboard/calendar` | Private | Tasks by month |

### Notifications & Activity
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications` | Private | Get notifications |
| PUT | `/api/notifications/read-all` | Private | Mark all read |
| GET | `/api/activity` | Private | Get activity log |

---

## 🚢 Deployment Guide

### Backend → Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the `backend` folder (or root with `rootDirectory = backend`)
4. Add environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<32+ char random string>
   JWT_EXPIRE=7d
   COOKIE_EXPIRE=7
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
5. Deploy → Copy the generated URL

### Frontend → Railway

1. New Service → select `frontend` folder
2. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
3. Railway auto-detects Vite → builds and serves

### MongoDB Atlas
1. Create free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create DB user → copy connection string
3. Whitelist IP: `0.0.0.0/0` (allow all for Railway)

---

## 🔐 Environment Variables

### Backend `.env`
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/teamflow
JWT_SECRET=change_this_to_a_long_random_string_at_least_32_chars
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 👤 Default Roles

| Role | Permissions |
|------|------------|
| **Admin** | Create/delete projects, add/remove members, full task CRUD, assign tasks |
| **Member** | View assigned projects, update task status only |

> Any user can register as admin or member during sign-up for demo purposes.

---

## 🧪 Tests

```bash
cd backend && npm test
```

**Coverage:**
- Auth: register, login, duplicate email, wrong password, protected routes
- Projects: CRUD, member management, duplicate member prevention
- Tasks: create, read, member status-only update, admin delete, member delete block
- Dashboard: stats endpoint
- Validation: missing fields, invalid email, missing project ID

---

## 🎥 Demo Script (2-5 min)

1. **Intro** (0:00–0:20) — "This is TeamFlow, a production-ready team task manager built with React, Node.js, and MongoDB."

2. **Auth** (0:20–0:50) — Register as admin → show JWT in cookie → login with wrong password to show validation → login success.

3. **Dark Mode** (0:50–1:00) — Toggle dark mode in top bar.

4. **Create Project** (1:00–1:30) — New Project → fill in name, description, color, due date, invite a member email → show project card with progress bar.

5. **Create Tasks** (1:30–2:15) — Open project → Add Task → set title, priority Critical, assign to member, due date yesterday → show overdue highlighting → create 3 more tasks across different priorities.

6. **Kanban Board** (2:15–2:45) — Show board view with 3 columns → click status badge on a card to cycle through → show list view.

7. **Member perspective** (2:45–3:15) — Open new tab, login as member → can see project → can update task status → cannot delete task (403 shown).

8. **Dashboard** (3:15–3:50) — Show stat cards, completion trend line chart, pie chart, overdue counter, upcoming tasks list, activity feed.

9. **Calendar** (3:50–4:15) — Show monthly calendar, click date to see task detail sidebar.

10. **Search & Filter** (4:15–4:40) — Go to All Tasks → search "bug" → filter by priority High → toggle Overdue → Export CSV.

11. **Wrap Up** (4:40–5:00) — "Full RBAC, real-time notifications, activity logs, dark mode, CSV export, and 18 backend tests."

---

## 📄 License

MIT © 2024 TeamFlow

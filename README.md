# 🎪 EventHub Management System

A full-stack Event Management System built with Angular 17 + Node.js + Express + MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Angular CLI: `npm install -g @angular/cli`

---

### 1. Setup Backend

```bash
cd backend
npm install
# Edit .env and set your MONGODB_URI
npm run dev
```

Backend runs on: http://localhost:5000

**Seed demo data:** Visit http://localhost:5000/api/seed in your browser once.

---

### 2. Setup Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:4200

---

## 🔑 Demo Credentials

| Role  | Email                | Password  |
|-------|---------------------|-----------|
| Admin | admin@eventhub.com  | admin123  |

> Run http://localhost:5000/api/seed first to create admin + sample events.

---

## 📁 Project Structure

```
eventhub/
├── backend/
│   ├── config/       # DB connection
│   ├── middleware/   # Auth middleware
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   └── server.js     # Entry point
└── frontend/
    └── src/app/
        ├── admin/    # Admin panel pages
        ├── pages/    # Public pages
        ├── services/ # API services
        ├── guards/   # Route guards
        └── models/   # TypeScript interfaces
```

## ✨ Features

### Public
- Home page with event listings, categories, highlights
- Browse & filter events (category, free/paid, online/offline)
- Event detail with ticket registration
- User registration & login

### Admin Panel (/admin)
- Dashboard with stats (users, events, participants, revenue)
- User management (CRUD)
- Event management (CRUD with full form)
- Participants list
- Feedback management
- Query resolution

## 🛠 Tech Stack
- **Frontend:** Angular 17, Standalone Components, CSS3, Material Icons
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Auth:** JWT (jsonwebtoken), bcryptjs
- **Fonts:** Syne (display) + DM Sans (body)

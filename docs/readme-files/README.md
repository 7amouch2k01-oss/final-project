# 🎓💼 TuniStudy / TuniJob
### *Tunisia's Academic & Career Onboarding Hub*

TuniStudy/TuniJob is a modern web application built with the MERN stack (MongoDB, Express, React, Node.js) and powered by Socket.io for real-time notifications and Stripe for tier payments. It provides a single point of access for university courses, internships, and job search/applications, eliminating physical administration loops.

---

## 🚀 Key Features

- 🎭 **Dynamic Dual-Branding UI**: One codebase that changes branding (headers, links, styling) dynamically based on logged in user's role:
  - **TuniStudy** (indigo) for students browsing universities & internships.
  - **TuniJob** (emerald) for citizens applying to careers or posting listings.
  - **TuniAdmin** (crimson) for administrative overview & approvals.
- ⚡ **Real-time Notifications**: Direct browser notifications powered by Socket.io for application statuses, new recruiter requests, and admin broadcasts.
- 💳 **Stripe Subscription Tiers**: Simple, paid checkout flows for highlighted job seeker profiles and pinned recruiter job listings.
- 📁 **Cloudinary Media Storage**: Secure, buffer-streamed storage for avatars, logos, and CV uploads.

---

## 🛠️ Tech Stack

- **Backend**: Node.js 20, Express, MongoDB/Mongoose, Socket.io, Stripe, Multer/Cloudinary, Nodemailer.
- **Frontend**: React 18, Vite, Zustand (Auth state), Axios (interceptor refresh token flow), React Router v6.

---

## ⚙️ Running Locally

### 1. Prerequisites
- Node.js 20+ installed.
- MongoDB Atlas cluster created.
- Stripe developer API keys.
- Cloudinary developer API keys.

### 2. Run the Backend
```bash
cd backend
npm install
npm run dev
```
Runs at `http://localhost:5000`.

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.

---

## 📁 Project Structure
```
Final Project/
├── backend/            # Express, Mongoose, Socket.io APIs
├── frontend/           # Vite, React, Zustand UIs
├── docs/               # Technical readmes
└── plans-and-updates/  # Project plan versions & walkthrough
```

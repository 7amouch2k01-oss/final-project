# 🎓 TuniStudy & TuniJob — Next-Gen Tunisian Career & Academic Super-Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v19+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Author Portfolio](https://img.shields.io/badge/Portfolio-mosma.vercel.app-e11d48?style=for-the-badge&logo=vercel&logoColor=white)](https://mosma.vercel.app)

<p align="center">
  <strong>A full-stack, AI-powered ecosystem connecting Tunisian high-school graduates, university students, and job-seeking citizens with verified academic institutions and top recruiters.</strong>
</p>

[Explore Live Platform](https://tunistudy-production.up.railway.app) • [View Author Portfolio](https://mosma.vercel.app) • [Report Bug](https://github.com/7amouch2k01-oss/final-project/issues)

</div>

---

## 🌟 Executive Overview

**TuniStudy & TuniJob** is a unified, bi-modal web platform engineered to eliminate bureaucratic friction in Tunisia's academic orientation and job markets. It unifies **two specialized portals** into one cohesive system:

1. 🎓 **TuniStudy (For Students)**: Digital application engine for university admissions (ESPRIT, INSAT, MSB, ENIT, etc.), internship matchmaking (PFE / Summer stages), Baccalaureate verification, score calculating algorithms, and an integrated **AI Academic Advisor** (Google Gemini).
2. 💼 **TuniJob (For Citizens & Recruiters)**: Fast-paced employment portal for remote, hybrid, and on-site careers in Tunisia, featuring verified recruiter rights, candidate inquiries, portfolio showcases ("Hire Me"), and Stripe checkout.
3. 🛡️ **TuniAdmin**: Real-time management console for platform analytics, user moderation, recruiter KYC validations, institution onboarding, and system audit logs.

---

## 📐 System Architecture

```mermaid
graph TD
    Client[React 19 + Zustand + Vite Frontend] -->|REST API / JWT| Gateway[Express 5 API Gateway]
    Client -->|WebSocket| RealTime[Socket.io Real-Time Layer]
    
    subgraph Backend Micro-Services
        Gateway --> Auth[Auth & RBAC Middleware]
        Gateway --> Gemini[Google Gemini AI Engine]
        Gateway --> Storage[Cloudinary Asset Pipeline]
        Gateway --> Billing[Stripe Payments Integration]
    end
    
    subgraph Persistence Layer
        Gateway --> DB[(MongoDB Atlas Database)]
    end
```

---

## 🚀 Key Features

### 🎓 For Students (TuniStudy)
- **Direct University Applications**: Submit admissions applications with transcripts and automated CV attachments.
- **PFE & Internship Portal**: Browse stages from Tunisia's leading tech hubs (*InstaDeep, Vermeg, Orange Digital Center, Telnet, Satoripop*).
- **⭐ Pro Student Hub**:
  - **AI Orientation Advisor**: Live conversational agent trained on the Tunisian orientation score formula (*Score de Réorientation*).
  - **Task & Sprint Board**: Kanban organizer for PFE deadlines and project deliverables.
  - **Score Simulator**: Accurate formula calculator across Math, Info, Sciences, and Technique branches.
- **Academic Verification**: Baccalaureate diploma validation and flexible post-bac path tracking to reach 100% profile strength.

### 💼 For Citizens & Recruiters (TuniJob)
- **Verified Recruiter Workflow**: Citizens can request recruiter rights to post jobs and review candidate CVs.
- **Direct Application Hub**: One-click application pipeline with status tracker (*Pending → Under Review → Accepted / Rejected*).
- **"Hire Me" Social Showcase**: Publish service availability cards with direct messaging and inquiries.

### 🛡️ For Super Admins (TuniAdmin)
- **KYC & Recruiter Rights Approval**: Review business credentials and approve or reject recruiter rights.
- **Institution Management**: Onboard academic universities and technical faculties.
- **Real-Time Analytics**: Visual metric charts powered by Chart.js.

---

## 💻 Tech Stack & Engineering

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, React Router v7, Zustand, Chart.js, Vite 8, Lucide & Custom SVG vectors |
| **Styling & Design** | CSS Variables, Custom Dark Glassmorphism + Soft Zinc Light Theme, Responsive Clamp Grids |
| **Backend Core** | Node.js (v18+), Express 5, Mongoose 9, Socket.io |
| **Security & Auth** | JWT (HttpOnly cookies + Bearer), BCrypt.js, Helmet, Express Rate Limit, Express Validator |
| **AI & Cloud** | Google Gemini Generative AI SDK, Cloudinary Multi-part storage, Stripe API |
| **DevOps & Deploy** | Railway CI/CD, Git, GitHub Actions |

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`
- **MongoDB**: Local URI or MongoDB Atlas connection string

### 2. Installation & Setup

```bash
# Clone repository
git clone https://github.com/7amouch2k01-oss/final-project.git
cd final-project

# Install root, backend, frontend, and admin dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in `backend/`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/tunistudy?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Engine
GEMINI_API_KEY=your_gemini_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
```

### 4. Database Seeding

Populate realistic Tunisian universities, internships, jobs, and test accounts:

```bash
cd backend
node seed.js
```

### 5. Running the Application

Launch each workspace in separate terminal windows:

```bash
# 1. Start Backend API (Port 5000)
cd backend && npm run dev

# 2. Start Frontend Client (Port 5173)
cd frontend && npm run dev

# 3. Start Admin Dashboard (Port 5174)
cd admin && npm run dev
```

---

## 🔑 Default Seed Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@tunistudy.tn` | `Password123!` | Full Admin Console |
| **Recruiter (Vermeg)** | `hr@vermeg.com` | `Password123!` | Job/Stage Postings & Applicant Review |
| **Student (ESPRIT)** | `ali.bensalem@esprit.tn` | `Password123!` | Pro Student Hub, Applications |
| **Student (INSAT)** | `sana.trabelsi@insat.u-carthage.tn` | `Password123!` | Pro Student Hub, Academic Track |
| **Citizen (Job Seeker)** | `ramy.gharbi@gmail.com` | `Password123!` | Job Listings, Hire-Me Posts |

---

## 👨‍💻 Author & Portfolio

<div align="center">

Developed with ❤️ by **Mohamed Oussama**

🌐 **Personal Portfolio**: [https://mosma.vercel.app](https://mosma.vercel.app)  
🐙 **GitHub Profile**: [@7amouch2k01-oss](https://github.com/7amouch2k01-oss)  
🔗 **Direct Portfolio Link**: [mosma.vercel.app](https://mosma.vercel.app)

---

*Crafted with modern software engineering standards, clean architecture, and passion for digital transformation in Tunisia.* 🇹🇳

</div>

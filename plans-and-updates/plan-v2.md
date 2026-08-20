# 🎓💼 Project Plan v2 — TuniStudy / TuniJob
### *One platform. Two identities. Built for Tunisia's future.*
**Status**: 🟡 Awaiting Final Approval
**Version**: 2.0 — Updated with all decisions
**Date**: 2026-08-07

---

## 💡 The Concept — Dual Brand Identity

The app **lives on one codebase** but wears two faces depending on who's logged in:

| Who's Looking | Brand Name | Accent Color | Vibe |
|--------------|-----------|-------------|------|
| 🎓 Student | **TuniStudy** | Indigo `#6c63ff` | Academic, focused, trustworthy |
| 💼 Graduate / Job Seeker | **TuniJob** | Emerald `#10b981` | Professional, ambitious, energetic |
| 🏢 Recruiter | **TuniJob** | Emerald `#10b981` | Corporate, clean, powerful |
| 🛡️ Admin | **TuniAdmin** | Crimson `#ef4444` | Control, authority, data |

> Same dark base (`#0d1117`), same layout system, same components — only the **logo, brand name, and accent color** swap dynamically based on `user.role`. This is handled in the React Theme Context.

---

## 👥 User Roles & Lifecycle (Updated)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                        REGISTER PAGE                            │
 │              Choose: "I'm a Student" | "I'm a Recruiter"       │
 └──────────────────────┬──────────────────────┬───────────────────┘
                        │                      │
                        ▼                      ▼
               [ STUDENT ]              [ RECRUITER ]
               Role: student            Status: pending ← NEW
               Full access to          Can browse, cannot post
               TuniStudy               or recruit until approved
                   │                          │
                   │                    Admin approves
                   │                          │
                   │                          ▼
                   │                  [ RECRUITER - ACTIVE ]
                   │                  Can post universities,
                   │                  stages, jobs
                   │                  Manage applicants
                   │                  (TuniJob branding)
                   │
              Marks graduation
                   │
                   ▼
          [ GRADUATE / JOB SEEKER ]
          Role: graduate
          Switches to TuniJob branding
          Full job board access
          Keeps stage search
          Application history

 ┌──────────────────────────────────────────────────────────────┐
 │                  [ ADMIN ] — TuniAdmin                       │
 │  Created manually in DB. Never through public registration.  │
 │  Full control over everything.                               │
 └──────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Updated Feature List

### 🔐 Auth & Onboarding
- Register as Student or Recruiter (radio selection)
- Email + password authentication
- JWT access token (15 min) + Refresh token (7 days, HTTP-only cookie)
- Forgot password → email link → reset
- Profile setup wizard after first login
- Email verification (optional v2 feature)

---

### 🎓 TuniStudy — Student Features
| Feature | Detail |
|---------|--------|
| University Browser | Search + filter by city, field, tuition, deadline |
| University Detail Page | Full info, photos, requirements, "Apply Now" |
| Stage Browser | Filter by domain, duration, city, type (remote/hybrid/on-site) |
| Stage Detail Page | Company info, requirements, deadline, "Apply" |
| My Applications | Live status tracker (pending → under review → ✅ / ❌) |
| Real-time Alerts | Socket.io: notified instantly when status changes |
| Profile Builder | Avatar (Cloudinary), bio, skills, CV upload (Cloudinary), languages |
| Graduation Button | Triggers role change to `graduate`, switches brand to TuniJob |

---

### 💼 TuniJob — Graduate / Job Seeker Features
*All Student features + :*
| Feature | Detail |
|---------|--------|
| Full Job Board | All recruiter-posted jobs, advanced filters |
| Salary Filter | Range slider (competitive vs entry level) |
| Contract Filter | CDI / CDD / Freelance |
| Experience Filter | Junior / Mid / Senior |
| Remote Filter | Remote / On-site / Hybrid |
| Save Jobs | Bookmark listings with a heart ❤️ |
| 1-Click Apply | Auto-fill from profile, add cover letter |
| Application History | Chronological log of all applications ever made |
| Premium Badge | (Paid) Highlighted applicant profile seen first by recruiters |

---

### 🏢 TuniJob — Recruiter Features
| Feature | Detail |
|---------|--------|
| Company Profile | Logo (Cloudinary), name, description, website, location |
| Pending State | After signup: can browse but sees "Awaiting Admin Approval" banner |
| Post University | Fill form → published to TuniStudy browser |
| Post Stage | Fill form → published to stage listings |
| Post Job | Fill form → published to job board |
| Applicant Inbox | Per-listing: see all applicants, their profiles + CV |
| Update Status | Drag-and-drop or button: Pending → Under Review → Accepted / Rejected |
| Real-time Alert | Socket.io: notified when a new applicant applies to their listing |
| Featured Listing | (Paid) Listing appears pinned at top with ⭐ badge |
| My Listings Dashboard | Active / Expired / Draft listings manager |

---

### 🛡️ TuniAdmin — Admin Dashboard
| Feature | Detail |
|---------|--------|
| Overview Cards | Total users, total listings, total applications, active recruiters |
| Analytics Charts | New users/day (line), Applications/week (bar), Role distribution (pie) |
| User Table | All users, searchable, filter by role, click to see full profile |
| Role Management | Manually change any user's role |
| Ban / Unban | Deactivate any account |
| Recruiter Approvals | List of `pending` recruiters → Approve or Reject with one click |
| All Listings | View every university, stage, job across all recruiters |
| Notification Broadcast | Send a message to all users, or target by role |
| Audit Log | Timestamped log of all admin actions |

---

## ⚡ Socket.io — Real-Time Architecture

### Server-Side Rooms
```
Each user joins their own room on connect:   socket.join(userId)
Each recruiter also joins:                   socket.join(`recruiter_${userId}`)
Admin joins:                                 socket.join('admin')
```

### Events Map
| Event | Direction | Trigger | Recipient |
|-------|-----------|---------|-----------|
| `application:status_changed` | Server → Client | Recruiter updates status | Applicant |
| `application:new` | Server → Client | Student applies | Recruiter |
| `recruiter:approved` | Server → Client | Admin approves recruiter | Recruiter |
| `recruiter:rejected` | Server → Client | Admin rejects recruiter | Recruiter |
| `notification:broadcast` | Server → All | Admin sends announcement | All users |
| `notification:new` | Server → Client | Any system event | Target user |

### Notification Bell (Frontend)
- Bell icon in navbar shows unread count badge
- Clicking opens a dropdown with last 10 notifications
- Each notification links to the relevant page
- Mark as read individually or "Mark all as read"

---

## 💳 Paid Features — Stripe Integration

### Pricing Tiers

#### For Recruiters
| Plan | Price | Features |
|------|-------|---------|
| Free | 0 TND | Post up to 3 listings, basic applicant list |
| **Pro** | 29 TND/month | Unlimited listings, featured badge on listings, analytics |
| **Business** | 79 TND/month | All Pro + priority support + applicant export CSV |

#### For Job Seekers (Graduate)
| Plan | Price | Features |
|------|-------|---------|
| Free | 0 TND | Apply to jobs, standard profile |
| **Premium** | 9 TND/month | Profile highlighted in applicant list, seen first by recruiters |

### Stripe Flow
```
User clicks "Upgrade" → Stripe Checkout Session created (backend)
→ User pays on Stripe hosted page
→ Stripe sends webhook to /api/webhooks/stripe
→ Backend updates user.subscription in DB
→ Features unlock immediately
```

---

## 🗃️ Updated Database Models

### User
```js
{
  name, email, password (bcrypt),
  role: enum['student', 'graduate', 'recruiter', 'admin'],
  recruiterStatus: enum['pending', 'approved', 'rejected'],  // recruiters only
  avatar: String (Cloudinary URL),
  bio: String,
  skills: [String],
  languages: [String],
  cvUrl: String (Cloudinary URL),
  education: [{ school, degree, field, from, to }],
  experience: [{ company, title, from, to, description }],
  savedJobs: [ObjectId → Job],
  subscription: {
    plan: enum['free', 'premium', 'pro', 'business'],
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    expiresAt: Date
  },
  isActive: Boolean,
  graduationDate: Date,
  createdAt, updatedAt
}
```

### University
```js
{
  recruiterId (ref: User),
  name, country, city, logo (Cloudinary),
  description, fields: [String],
  requirements: [String], tuitionFee,
  applicationDeadline, isActive,
  isFeatured: Boolean (paid),
  createdAt
}
```

### Internship (Stage)
```js
{
  recruiterId (ref: User),
  title, company, description,
  requirements: [String],
  location, type: enum['remote','hybrid','on-site'],
  duration: String, stipend,
  deadline, isActive,
  isFeatured: Boolean (paid),
  createdAt
}
```

### Job
```js
{
  recruiterId (ref: User),
  title, company, description,
  requirements: [String], location,
  type: enum['remote','on-site','hybrid'],
  salary: { min, max, currency },
  contractType: enum['CDI','CDD','freelance','internship'],
  experienceLevel: enum['junior','mid','senior'],
  deadline, isActive,
  isFeatured: Boolean (paid),
  createdAt
}
```

### Application
```js
{
  applicantId (ref: User),
  targetId, targetType: enum['university','internship','job'],
  status: enum['pending','under_review','accepted','rejected'],
  coverLetter: String,
  documents: [String] (Cloudinary URLs),
  appliedAt, updatedAt
}
```

### Notification
```js
{
  userId (ref: User) | null (broadcast),
  title, message,
  type: enum['application','approval','system','broadcast'],
  link: String,
  isRead: Boolean,
  createdAt
}
```

---

## 🔗 Complete API Route Plan

```
# Auth
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token

# User / Profile
GET    /api/users/me
PATCH  /api/users/me
PATCH  /api/users/me/graduate        ← role: student → graduate
PATCH  /api/users/me/avatar          ← Cloudinary upload
PATCH  /api/users/me/cv              ← Cloudinary upload
POST   /api/users/me/saved-jobs/:jobId
DELETE /api/users/me/saved-jobs/:jobId

# Universities
GET    /api/universities             ← public, paginated + filters
GET    /api/universities/:id         ← public
POST   /api/universities             ← approved recruiter only
PATCH  /api/universities/:id         ← owner recruiter only
DELETE /api/universities/:id         ← owner recruiter only

# Internships (Stage)
GET    /api/internships              ← public
GET    /api/internships/:id
POST   /api/internships             ← approved recruiter only
PATCH  /api/internships/:id
DELETE /api/internships/:id

# Jobs
GET    /api/jobs                     ← graduate + admin
GET    /api/jobs/:id
POST   /api/jobs                    ← approved recruiter only
PATCH  /api/jobs/:id
DELETE /api/jobs/:id

# Applications
POST   /api/applications            ← student/graduate
GET    /api/applications/mine       ← applicant's own list
GET    /api/applications/listing/:listingId  ← recruiter sees applicants
PATCH  /api/applications/:id/status ← recruiter only

# Notifications
GET    /api/notifications           ← user's notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all

# Payments (Stripe)
POST   /api/payments/create-checkout-session
POST   /api/payments/cancel-subscription
POST   /api/webhooks/stripe          ← Stripe webhook (raw body)

# Admin
GET    /api/admin/stats
GET    /api/admin/users
PATCH  /api/admin/users/:id/role
PATCH  /api/admin/users/:id/ban
GET    /api/admin/recruiters/pending
PATCH  /api/admin/recruiters/:id/approve
PATCH  /api/admin/recruiters/:id/reject
GET    /api/admin/listings
POST   /api/admin/notifications/broadcast
GET    /api/admin/audit-log
```

---

## ⚙️ Final Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 20 | LTS, fast, async |
| API | Express.js | Lightweight, middleware-rich |
| Database | MongoDB + Mongoose | Flexible schema, great with JS |
| Auth | JWT + bcryptjs | Industry standard |
| Real-time | Socket.io | Bidirectional events |
| File Uploads | Multer + Cloudinary | Scalable media storage |
| Payments | Stripe | Industry-leading, great DX |
| Email | Nodemailer + Gmail/SMTP | Password reset, notifications |
| Security | Helmet + CORS + express-rate-limit + express-validator | OWASP Top 10 |
| Frontend | React 18 + Vite | Fast, modern |
| Routing | React Router v6 | Client-side navigation |
| State | Zustand | Minimal, no boilerplate |
| HTTP | Axios | Interceptors + token refresh |
| Styling | Vanilla CSS + CSS Variables | Full control, theme switching |
| Socket Client | socket.io-client | Real-time frontend |
| Charts (Admin) | Chart.js + react-chartjs-2 | Analytics charts |

---

## 🎨 Design System — Dual Brand

```css
/* TuniStudy (student) */
--brand-name:    "TuniStudy";
--color-accent:  #6c63ff;   /* indigo */
--color-accent2: #a78bfa;

/* TuniJob (graduate/recruiter) */
--brand-name:    "TuniJob";
--color-accent:  #10b981;   /* emerald */
--color-accent2: #34d399;

/* TuniAdmin (admin) */
--brand-name:    "TuniAdmin";
--color-accent:  #ef4444;   /* crimson */
--color-accent2: #f87171;

/* Shared base */
--color-bg:      #0d1117;
--color-surface: #161b22;
--color-border:  rgba(255,255,255,0.08);
--color-text:    #e6edf3;
--color-muted:   #8b949e;
--font-display:  'Plus Jakarta Sans', sans-serif;
--font-body:     'Inter', sans-serif;
```

---

## 🗓️ Build Phases

```
Phase 1: Backend Foundation (Day 1)
  ✦ npm init, folder structure, environment setup
  ✦ MongoDB connection, Express server
  ✦ Cloudinary + Multer config

Phase 2: Models (Day 1)
  ✦ User, University, Internship, Job, Application, Notification

Phase 3: Auth System (Day 2)
  ✦ Register, Login, JWT middleware, Refresh token
  ✦ Role guard middleware (student, graduate, recruiter, admin)
  ✦ Forgot/reset password (Nodemailer)

Phase 4: Core CRUD Routes (Day 3–4)
  ✦ Universities, Internships, Jobs (with recruiter approval check)
  ✦ Applications (apply, status update)
  ✦ File upload endpoints (Cloudinary)

Phase 5: Real-time (Socket.io) (Day 4)
  ✦ Socket server setup
  ✦ Room joining on connect
  ✦ All events implemented

Phase 6: Payments (Stripe) (Day 5)
  ✦ Checkout session creation
  ✦ Webhook handler
  ✦ Subscription status updates

Phase 7: Admin Routes (Day 5)
  ✦ Stats, user management, recruiter approvals

Phase 8: Frontend — Design System (Day 6)
  ✦ Global CSS, theme context, dual brand logic
  ✦ Reusable components (Card, Button, Input, Modal, Navbar)

Phase 9: Frontend — Pages (Day 7–9)
  ✦ Auth: Login, Register, Forgot Password
  ✦ TuniStudy: Home, University browser, Stage browser, Applications
  ✦ TuniJob: Job board, Saved jobs
  ✦ Recruiter: Dashboard, Post listing, Applicant inbox
  ✦ Admin: TuniAdmin full dashboard

Phase 10: Polish & Deploy (Day 10)
  ✦ Mobile responsive check
  ✦ Error states, loading skeletons
  ✦ Deploy backend (Railway) + frontend (Vercel)
```

---

## ✅ Decisions Confirmed

| # | Question | Your Answer |
|---|---------|-------------|
| 1 | App name | TuniStudy (students) / TuniJob (jobs/recruiters) |
| 2 | Recruiter signup | Free sign-up, browse OK, needs admin approval to post |
| 3 | File uploads | Cloudinary ✅ |
| 4 | Notifications | Socket.io real-time ✅ |
| 5 | Paid features | Yes — Stripe integration ✅ |

---

> **Hit Proceed to start Phase 1 — Backend Foundation** 🚀
> I will build in strict order. No frontend until the API is complete and tested.

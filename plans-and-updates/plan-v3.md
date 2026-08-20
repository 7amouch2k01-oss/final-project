# 🎓💼 Project Plan v3 — TuniStudy / TuniJob
### *One platform. Two identities. Three roles.*
**Status**: 🟡 Awaiting Approval
**Version**: 3.0 — Role Restructure: Citizen replaces Graduate + Recruiter
**Date**: 2026-08-07

---

## 🔄 What Changed from v2

| v2 | v3 |
|----|----|
| `graduate` (job seeker only) | ❌ Removed |
| `recruiter` (post listings only) | ❌ Removed |
| — | ✅ `citizen` = job seeker + recruiter in ONE |

> A **Citizen** is any non-student person. By default they can search and apply for jobs. If they also want to **post** listings and recruit people, they request that right — and admin approves it. One account, two powers.

---

## 👥 Final Role System (3 Roles)

```
┌──────────────────────────────────────────────────────────────────┐
│                    4 ROLES TOTAL                                 │
│                                                                  │
│  student   →   citizen   →   (citizen with recruit rights)      │
│                                              ↑                  │
│                                      admin approves             │
│                                                                  │
│  admin  ─────────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────────────┘
```

### Role: `student` → TuniStudy 🎓
- Register directly as a student
- Browse universities → apply
- Browse stages (internships) → apply
- Track all application statuses
- After graduation: **one click → becomes `citizen`**

### Role: `citizen` → TuniJob 💼
A citizen has **two built-in sides**:

#### 🔍 Seeker Side (default, no approval needed)
- Browse the full job board
- Apply to jobs and stages
- Save jobs / build profile
- Track applications

#### 📢 Recruiter Side (needs admin approval)
- Request recruit rights from their profile
- While pending: sees "Recruit Access: Pending Approval" badge
- Once approved: unlock ability to post universities, stages, jobs
- Manage their posted listings
- View and manage applicants
- Both sides active **simultaneously** — a citizen can apply to jobs AND post jobs at the same time

### Role: `admin` → TuniAdmin 🛡️
- Full platform control
- Approve/reject citizen recruit rights
- Manage all users and listings
- Analytics and audit log

---

## 🗂️ Citizen — Full Feature Set

### 🔍 Seeker Features (always available)
| Feature | Detail |
|---------|--------|
| Job Board | All posted jobs, advanced filters |
| Stage Board | All internships (also visible to students) |
| Save Jobs | Bookmark with ❤️ |
| 1-Click Apply | Auto-fill from profile + cover letter |
| Application Tracker | Live status per application (Socket.io) |
| Career Profile | Avatar, bio, skills, experience, CV (Cloudinary) |
| Premium Badge | (Paid) Profile boosted in recruiter's applicant list |

### 📢 Recruiter Features (after admin approval)
| Feature | Detail |
|---------|--------|
| Request Recruit Rights | Button in citizen dashboard → triggers admin notification |
| Recruit Status Badge | "Pending / Approved / Rejected" visible in their dashboard |
| Post University | Published to TuniStudy university browser |
| Post Stage | Published to stage listings |
| Post Job | Published to job board |
| Applicant Inbox | Per-listing view of all applicants + their CVs |
| Update Status | Pending → Under Review → Accepted / Rejected |
| Real-time Alert | Socket.io: new applicant notification |
| Featured Listing | (Paid) Listing pinned at top with ⭐ |
| Listing Dashboard | All active/expired/draft listings in one view |

---

## 🗃️ Updated Database Model — User

```js
{
  // Core
  name: String,
  email: String (unique),
  password: String (bcrypt),
  role: enum['student', 'citizen', 'admin'],

  // Citizen recruit rights
  recruitRights: {
    status: enum['none', 'pending', 'approved', 'rejected'],
    requestedAt: Date,
    reviewedAt: Date,
    rejectionReason: String
  },

  // Profile
  avatar: String,           // Cloudinary URL
  bio: String,
  skills: [String],
  languages: [String],
  cvUrl: String,            // Cloudinary URL
  education: [{
    school, degree, field, from, to
  }],
  experience: [{
    company, title, from, to, description
  }],

  // Job seeker
  savedJobs: [ObjectId],    // ref: Job

  // Subscription (Stripe)
  subscription: {
    plan: enum['free', 'premium', 'pro', 'business'],
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    expiresAt: Date
  },

  // Company info (citizen with recruit rights)
  company: {
    name: String,
    logo: String,           // Cloudinary URL
    description: String,
    website: String,
    location: String
  },

  isActive: Boolean,
  graduationDate: Date,
  createdAt, updatedAt
}
```

---

## 🔗 Updated API Routes

```
# Auth
POST   /api/auth/register           ← role: 'student' | 'citizen'
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token

# User / Profile
GET    /api/users/me
PATCH  /api/users/me
PATCH  /api/users/me/avatar          ← Cloudinary
PATCH  /api/users/me/cv              ← Cloudinary
POST   /api/users/me/graduate        ← student → citizen (role upgrade)
POST   /api/users/me/request-recruit ← citizen requests recruit rights
POST   /api/users/me/saved-jobs/:id
DELETE /api/users/me/saved-jobs/:id

# Universities
GET    /api/universities             ← public
GET    /api/universities/:id
POST   /api/universities             ← citizen with approved recruit rights
PATCH  /api/universities/:id         ← owner citizen only
DELETE /api/universities/:id

# Stages (Internships)
GET    /api/stages                   ← public (students + citizens)
GET    /api/stages/:id
POST   /api/stages                   ← citizen with approved recruit rights
PATCH  /api/stages/:id
DELETE /api/stages/:id

# Jobs
GET    /api/jobs                     ← citizens + admin only
GET    /api/jobs/:id
POST   /api/jobs                     ← citizen with approved recruit rights
PATCH  /api/jobs/:id
DELETE /api/jobs/:id

# Applications
POST   /api/applications             ← student or citizen (seeker side)
GET    /api/applications/mine        ← own applications
GET    /api/applications/listing/:id ← citizen (recruiter side) sees their listing's applicants
PATCH  /api/applications/:id/status  ← citizen (recruiter side) only

# Notifications
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all

# Payments
POST   /api/payments/create-checkout-session
POST   /api/payments/cancel-subscription
POST   /api/webhooks/stripe

# Admin
GET    /api/admin/stats
GET    /api/admin/users
PATCH  /api/admin/users/:id/role
PATCH  /api/admin/users/:id/ban
GET    /api/admin/recruit-requests   ← citizens awaiting recruit approval
PATCH  /api/admin/recruit-requests/:id/approve
PATCH  /api/admin/recruit-requests/:id/reject
GET    /api/admin/listings
POST   /api/admin/notifications/broadcast
GET    /api/admin/audit-log
```

---

## ⚡ Updated Socket.io Events

| Event | Trigger | Who Gets It |
|-------|---------|------------|
| `application:status_changed` | Citizen (recruiter) updates applicant status | Applicant (student or citizen) |
| `application:new` | Anyone applies to a listing | Citizen who posted the listing |
| `recruit:request_received` | Citizen requests recruit rights | Admin room |
| `recruit:approved` | Admin approves recruit rights | That citizen |
| `recruit:rejected` | Admin rejects recruit rights | That citizen |
| `graduation:confirmed` | Student marks graduation | That student (becomes citizen) |
| `notification:broadcast` | Admin sends announcement | All connected users |

---

## 🎨 Brand & Theme Per Role

```
role === 'student'
  → Brand: "TuniStudy"
  → Accent: #6c63ff (indigo)
  → Nav: Universities | Stages | My Applications | Profile

role === 'citizen'  (seeker side default)
  → Brand: "TuniJob"
  → Accent: #10b981 (emerald)
  → Nav: Jobs | Stages | Saved | My Applications | Profile
         + "Recruiter Hub" tab (if recruit rights approved)

role === 'admin'
  → Brand: "TuniAdmin"
  → Accent: #ef4444 (crimson)
  → Nav: Dashboard | Users | Listings | Recruit Requests | Analytics
```

---

## 📋 Registration Flow (Updated)

```
Landing Page
     │
     ├── "I'm a Student"   → Register with role: student
     │                        Enter: name, email, password, field of study
     │
     └── "I'm a Citizen"   → Register with role: citizen
                              Enter: name, email, password
                              (Seeker mode active immediately)
                              (Recruiter mode: request from dashboard)
```

---

## ✅ All Confirmed Decisions (v3)

| Decision | Value |
|----------|-------|
| App name (students) | TuniStudy |
| App name (citizens + admin) | TuniJob / TuniAdmin |
| Roles | `student`, `citizen`, `admin` |
| Citizen = | Job seeker + recruiter in one account |
| Recruit rights | Request from dashboard → admin approves |
| File uploads | Cloudinary |
| Real-time | Socket.io |
| Payments | Stripe (tiered plans) |

---

## 🗓️ Build Phases (Unchanged Order)

```
Phase 1  → Backend setup (Express, MongoDB, folder structure)
Phase 2  → All Mongoose models
Phase 3  → Auth (register/login/JWT/roles)
Phase 4  → Core CRUD (universities, stages, jobs, applications)
Phase 5  → Socket.io (real-time events)
Phase 6  → Stripe payments
Phase 7  → Admin routes
Phase 8  → Frontend design system + theme context (dual brand)
Phase 9  → All pages (Auth → TuniStudy → TuniJob → TuniAdmin)
Phase 10 → Polish + deploy
```

---

> **✅ Approve this plan to start Phase 1 — Backend Foundation** 🚀

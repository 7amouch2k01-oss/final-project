# 🎓 Project Plan — EduBridge
### *The all-in-one platform for enrollment, internships & careers*
**Status**: 🟡 Awaiting Approval  
**Date**: 2026-08-07

---

## 💡 The Big Idea

**EduBridge** connects three worlds in one platform:
- Students applying to universities remotely
- Graduates hunting for internships ("stage") and real jobs
- Recruiters posting opportunities and reviewing candidates
- An admin who controls everything from a private dashboard

> Think of it as **LinkedIn + University Portal + Job Board** — all in one place, fully remote, no paperwork, no office visits.

---

## 👥 User Roles & Lifecycle

```
New User Registers
       │
       ▼
   [ STUDENT ]
   - Browse & apply to universities
   - Search for "stage" (internship) listings
   - Track application statuses
   - Build profile (grades, CV, skills)
       │
       │  (Marks graduation in profile)
       ▼
   [ GRADUATE / JOB SEEKER ]
   - Role automatically upgraded after graduation flag
   - Access full job board (remote + office)
   - Keep internship search access
   - Apply with enhanced profile (work experience added)

   [ RECRUITER ]
   - Company/institution account
   - Post universities (for enrollment)
   - Post internship listings (stage)
   - Post job listings (remote/office)
   - Review applicants, change status (pending/accepted/rejected)
   - Manage their own listings dashboard

   [ ADMIN ]  (You only)
   - Full system overview dashboard
   - Manage all users + change roles manually
   - See all listings (universities, internships, jobs)
   - Approve or ban recruiter accounts
   - View platform analytics (total users, applications, trends)
   - Send system notifications
```

---

## 🗂️ Feature Breakdown

### 🔐 Auth System
- Register with email + password
- Login / Logout
- JWT access + refresh tokens (HTTP-only cookies)
- Role assigned at registration: `student` | `recruiter`
- Admin role: manually set in DB (never public registration)
- Password reset via email (nodemailer)
- Profile completeness indicator

---

### 🎓 Student Features
| Feature | Details |
|---------|---------|
| Browse Universities | Full searchable list with filters (country, city, field of study, tuition) |
| Apply to University | Submit application form with documents upload (CV, grades, letter) |
| Browse Internships (Stage) | Filter by field, duration, location, remote/hybrid/on-site |
| Apply to Stage | One-click apply with saved profile |
| Track Applications | Dashboard showing all applications + status (pending/accepted/rejected) |
| Graduation Flag | Mark graduation → triggers role upgrade to Graduate |
| Profile Builder | Name, photo, bio, education, skills, languages, CV upload |

---

### 💼 Graduate / Job Seeker Features
*Everything students have, PLUS:*
| Feature | Details |
|---------|---------|
| Full Job Board | Browse all job listings posted by recruiters |
| Advanced Filters | Remote / On-site / Hybrid, salary range, experience level, contract type |
| Apply to Jobs | Submit with profile + cover letter |
| Saved Jobs | Bookmark listings for later |
| Application History | Full history of all applications across career |

---

### 🏢 Recruiter Features
| Feature | Details |
|---------|---------|
| Company Profile | Logo, name, description, website, location |
| Post University | Add university with enrollment requirements |
| Post Internship (Stage) | Title, description, requirements, duration, deadline |
| Post Job | Title, salary, type, description, requirements, deadline |
| Applicant Inbox | List of all people who applied to their listings |
| Manage Statuses | Accept / Reject / Mark as Under Review per applicant |
| Listing Dashboard | See all their active/closed listings in one place |

---

### 🛡️ Admin Dashboard (Private)
| Feature | Details |
|---------|---------|
| User Management | List all users, filter by role, ban/unban, manually change role |
| Recruiter Approvals | Approve or reject new recruiter registrations |
| All Listings | View all universities, internships, jobs across all recruiters |
| Application Stats | Total applications per listing, acceptance rates |
| Platform Analytics | Charts: new users per day, applications per week, top listings |
| System Notifications | Broadcast messages to all users or specific roles |

---

## 🗃️ Database Models (MongoDB)

### User
```
_id, name, email, password (hashed), role (student|graduate|recruiter|admin),
avatar, bio, skills[], languages[], cvUrl, isVerified, isActive,
graduationDate, createdAt, updatedAt
```

### University (posted by Recruiter)
```
_id, recruiterId, name, country, city, logo, description,
fields[], requirements[], tuitionFee, applicationDeadline, isActive
```

### Internship / Stage
```
_id, recruiterId, title, company, description, requirements[],
location, type (remote|hybrid|on-site), duration, stipend,
deadline, isActive, createdAt
```

### Job
```
_id, recruiterId, title, company, description, requirements[],
location, type (remote|on-site|hybrid), salary, contractType
(CDI|CDD|freelance), experienceLevel (junior|mid|senior),
deadline, isActive, createdAt
```

### Application
```
_id, applicantId, targetId (uni|internship|job), targetType,
status (pending|under_review|accepted|rejected),
coverLetter, documents[], appliedAt, updatedAt
```

### Notification
```
_id, userId (or broadcast), message, type, isRead, createdAt
```

---

## 🔗 API Routes Summary

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password

GET    /api/users/me
PATCH  /api/users/me
PATCH  /api/users/me/graduate        ← triggers role upgrade

GET    /api/universities             ← public, paginated, filterable
GET    /api/universities/:id
POST   /api/universities             ← recruiter only
PATCH  /api/universities/:id
DELETE /api/universities/:id

GET    /api/internships              ← public
POST   /api/internships             ← recruiter only
PATCH  /api/internships/:id

GET    /api/jobs                     ← graduate + admin
POST   /api/jobs                    ← recruiter only
PATCH  /api/jobs/:id

POST   /api/applications            ← student/graduate apply
GET    /api/applications/mine       ← applicant sees their own
PATCH  /api/applications/:id/status ← recruiter updates status

GET    /api/admin/users             ← admin only
PATCH  /api/admin/users/:id/role    ← admin only
GET    /api/admin/stats             ← admin only
PATCH  /api/admin/recruiters/:id/approve
```

---

## 🎨 UI Vision

- **Dark mode** as default — feels modern and premium
- **Glassmorphism cards** for listings and profiles
- **Color system**: Deep navy `#0d1117` + Electric indigo `#6c63ff` + Teal accent `#00d2ff`
- **Font**: Plus Jakarta Sans (headings) + Inter (body)
- **Animations**: Smooth page transitions, skeleton loaders, hover lifts
- **Three distinct layouts**: Student portal / Recruiter hub / Admin command center

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Runtime | Node.js 20 |
| API Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| File Uploads | Multer + Cloudinary |
| Email | Nodemailer |
| Security | Helmet, CORS, rate-limit, express-validator |
| Frontend | React 18 + Vite |
| State | Zustand |
| HTTP | Axios |
| Styling | Vanilla CSS + CSS Variables |

---

## ❓ Open Questions For You

> **Please answer before I start:**

1. **App name** — Do you like "EduBridge"? Or do you have another name?
2. **Recruiter registration** — Self-register + wait for admin approval? Or register freely?
3. **File uploads** — Do you have a Cloudinary account? Or use local storage for now?
4. **Real-time notifications** — Socket.io live notifications or simple in-app DB notifications?
5. **Payments** — Any plans for paid/premium features?

---

## 🟢 To Start Building

Once you approve this plan and answer the questions above, I will build in this order:

```
Phase 1: Backend Foundation
  → Project init, folder structure, DB connection, server setup

Phase 2: Models
  → User, University, Internship, Job, Application, Notification

Phase 3: Auth
  → Register, Login, JWT middleware, role guards

Phase 4: Core Routes
  → All CRUD for listings + applications

Phase 5: Admin Routes
  → Stats, user management, approvals

Phase 6: Frontend
  → Design system → Auth pages → Student portal → Recruiter hub → Admin dashboard
```

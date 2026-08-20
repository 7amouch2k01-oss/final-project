# TuniStudy / TuniJob — Backend

REST API + Socket.io server for the TuniStudy/TuniJob platform.

## Tech Stack
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (access + refresh) + bcryptjs
- **Real-time**: Socket.io
- **Uploads**: Multer + Cloudinary
- **Payments**: Stripe
- **Email**: Nodemailer
- **Security**: Helmet, CORS, express-rate-limit, express-validator

## Folder Structure
```
backend/
├── config/          # DB + Cloudinary config
├── controllers/     # Request handlers (thin)
├── middleware/      # auth, errorHandler
├── models/          # Mongoose schemas
├── routes/          # Express routers
├── services/        # Business logic
├── socket/          # Socket.io event handlers
├── utils/           # apiResponse, generateToken, sendEmail
├── validators/      # Input validation schemas
└── server.js        # Entry point
```

## Setup

1. Copy `.env.example` to `.env` and fill in your values
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Health check: `http://localhost:5000/api/health`

## Available Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Production start |

## API Base URL
```
http://localhost:5000/api
```

## Environment Variables
See `.env.example` for all required variables:
- `MONGO_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — JWT secrets
- `CLOUDINARY_*` — Cloudinary credentials
- `EMAIL_USER` / `EMAIL_PASS` — Gmail app password
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe keys
- `CLIENT_URL` — Frontend URL for CORS

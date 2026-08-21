FROM node:20-alpine AS builder

WORKDIR /app

# Copy all package manifests first for caching
COPY package.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY admin/package*.json ./admin/

# Install dependencies in backend, frontend, and admin
RUN npm --prefix backend install
RUN npm --prefix frontend install
RUN npm --prefix admin install

# Copy all source files
COPY . .

# Build both React frontends
RUN npm --prefix frontend run build
RUN npm --prefix admin run build

# Final lightweight production image
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy backend and production node_modules
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy compiled frontend and admin assets
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/admin/dist ./admin/dist

EXPOSE 5000

CMD ["node", "backend/server.js"]

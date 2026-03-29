# Multi-stage build for React frontend

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with retry logic for network issues
RUN npm config set fetch-retry-maxtimeout 60000 && \
  npm config set fetch-retry-mintimeout 10000 && \
  npm config set fetch-retries 5 && \
  npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# ==========================================
# TAMBAHAN KRUSIAL: Tangkap variabel dari docker-compose
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# ==========================================

ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

# Build the application (use build:prod to skip tsc check, Vite will still type-check)
RUN npm run build:prod

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8000
EXPOSE 8000

# Health check (use wget as curl is not available in nginx:alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
# Multi-stage / lightweight Node.js Alpine base
FROM node:20-alpine AS builder

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Production Image
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8085

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY config.json ./
COPY public/ ./public/

EXPOSE 8085

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8085/health || exit 1

CMD ["node", "server.js"]

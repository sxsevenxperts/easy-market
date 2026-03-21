# ============================================================
# Easy Market - Dockerfile
# Multi-stage build for production-ready Node.js backend
# ============================================================

# ----------------------------
# Stage 1: Builder
# ----------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (leverages Docker layer cache)
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY backend/src ./src

# ----------------------------
# Stage 2: Production
# ----------------------------
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Copy built artifacts from builder stage
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/src ./src
COPY --chown=appuser:nodejs backend/package*.json ./

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 3000

# Health check using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/index.js"]

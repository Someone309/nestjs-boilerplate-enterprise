# ==============================================
# Multi-stage Dockerfile for NestJS Application
# Section 12.8: Deployment Strategy
# ==============================================

# ----------------------------------------------
# Stage 1: Dependencies
# ----------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies only (for caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# ----------------------------------------------
# Stage 2: Builder
# ----------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN yarn build

# Remove dev dependencies
RUN yarn install --frozen-lockfile --production=true && \
    yarn cache clean

# ----------------------------------------------
# Stage 3: Production Runner
# ----------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health/live || exit 1

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"]

# =============================================================================
# NXZEN EMPLOYEE MANAGEMENT SYSTEM - BACKEND DOCKERFILE
# =============================================================================
# Multi-stage build for production optimization
# =============================================================================

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nxzen -u 1001

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    tzdata

# Set timezone
ENV TZ=UTC

# Copy built dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/uploads/documents \
    /app/uploads/expenses \
    /app/logs \
    /app/backups \
    /app/ssl

# Set proper permissions
RUN chown -R nxzen:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nxzen

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]

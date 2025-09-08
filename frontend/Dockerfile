
# =============================================================================
# NXZEN EMPLOYEE MANAGEMENT SYSTEM - FRONTEND DOCKERFILE
# =============================================================================
# Multi-stage build for production optimization
# =============================================================================

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache     python3     make     g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run &&     chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html &&     chmod -R 755 /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3     CMD curl -f http://localhost/health || exit 1

# Start nginx (runs as nginx user by default)
CMD ["nginx", "-g", "daemon off;"]

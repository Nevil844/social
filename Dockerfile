# Multi-stage build for Social virtual workspace
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies (including dev dependencies for building)
RUN npm ci && npm cache clean --force
RUN cd client && npm ci && npm cache clean --force
RUN cd server && npm ci --only=production && npm cache clean --force

# Copy source code (node_modules excluded by .dockerignore)
COPY . .

# Build client application
RUN cd client && npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files for production dependency installation
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force
RUN cd server && npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server

# Copy other necessary files
COPY package*.json ./

# Expose port
EXPOSE 3001

# Health check
COPY server/healthcheck.js ./healthcheck.js

# Start server
CMD ["npm", "start"] 
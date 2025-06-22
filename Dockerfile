# Multi-stage build for Social virtual workspace
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force
RUN cd client && npm ci --only=production && npm cache clean --force
RUN cd server && npm ci --only=production && npm cache clean --force

# Production build stage
FROM base AS production

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 3001

# Health check
COPY server/healthcheck.js ./healthcheck.js

# Start server
CMD ["npm", "start"] 
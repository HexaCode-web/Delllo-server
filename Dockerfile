# Stage 1: Build stage
FROM node:16.15-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code (including the sockets directory)
COPY sockets ./sockets
COPY . . 

# Ensure correct permissions
RUN ls -l /usr/src/app  # Debugging: Check if sockets/ exists

# Stage 2: Production stage
FROM node:16.15-alpine

WORKDIR /usr/src/app

# Install PM2 globally
RUN npm install -g pm2

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Explicitly copy necessary application files
COPY --from=builder /usr/src/app/server.js ./server.js
COPY --from=builder /usr/src/app/functions ./functions
COPY --from=builder /usr/src/app/controllers ./controllers
COPY --from=builder /usr/src/app/middleware ./middleware
COPY --from=builder /usr/src/app/models ./models
COPY --from=builder /usr/src/app/routes ./routes
COPY --from=builder /usr/src/app/sockets ./sockets  
COPY --from=builder /usr/src/app/.env ./.env

# Verify copied contents
RUN ls -l /usr/src/app  

# Ensure correct ownership
RUN chown -R appuser:appgroup /usr/src/app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5003

# Start the application
CMD ["pm2-runtime", "server.js"]

# ---------- Stage 1: Build ----------
    
    # Use the official Node.js image as the base image
    FROM node:24-bookworm AS builder
    
    # Set the working directory inside the container
    WORKDIR /usr/src/app
    
    # Copy package.json and package-lock.json to the working directory
    COPY package*.json ./
    
    # Install the application dependencies
    RUN npm ci
    
    # Copy the rest of the application files
    COPY . .
    
    # Build the NestJS application
    RUN npm run build

# ---------- Stage 2: Production ----------

    # Use the official Node.js image as the base image
    FROM node:24-slim AS production    
    # Set the working directory inside the container
    WORKDIR /usr/src/app
    
    # Copy package.json and package-lock.json to the working directory
    COPY package*.json ./
    
    # Install ONLY production deps
    RUN npm ci --omit=dev

    # Copy built files from builder
    COPY --from=builder /usr/src/app/dist ./dist
    
    # Expose the application port
    EXPOSE 3000
    
    # Command to run the application
    CMD ["node", "--enable-source-maps", "dist/main"]
# ---------- Build stage ----------
    FROM node:18-alpine AS build

    WORKDIR /app
    
    # Install dependencies
    COPY package*.json ./
    
    RUN npm install --legacy-peer-deps
    
    # Copy source code
    COPY . .
    
    # Build the Vite app
    RUN npm run build
    
    
    # ---------- Production stage ----------
    FROM nginx:alpine
    
    # Remove default Nginx static assets
    RUN rm -rf /usr/share/nginx/html/*
    
    # Copy build output from build stage
    COPY --from=build /app/build /usr/share/nginx/html
    
    # Copy custom Nginx configuration
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # Expose port 80
    EXPOSE 80
    
    # Start Nginx
    CMD ["nginx", "-g", "daemon off;"]
    
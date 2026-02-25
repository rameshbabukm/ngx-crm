# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy module files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Vite project
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration enabling CORS
COPY nginx.conf.template /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

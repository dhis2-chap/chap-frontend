# Stage 1: Build the React frontend
FROM node:18-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy only package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build



# Stage 2: Serve the frontend using a lightweight server
FROM nginx:alpine

# Copy the built React app from the build stage
COPY --from=build /app/build/app /usr/share/nginx/html

# Copy a default nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

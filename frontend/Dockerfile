FROM node:22-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

EXPOSE 5173

# Start Vite dev server with host flag
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

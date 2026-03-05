FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all source code (including firebase-service-account.json)
COPY . .

# Expose Express server port
EXPOSE 3000

# Run with nodemon for hot-reload in development
CMD ["npm", "run", "dev"]

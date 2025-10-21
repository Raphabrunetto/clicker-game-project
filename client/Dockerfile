FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the app
COPY . .

EXPOSE 3000

# Default to dev server for hot reload
CMD ["npm", "run", "dev"]


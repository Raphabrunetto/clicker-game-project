FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy schema for prisma generate step (optional at runtime too)
COPY prisma ./prisma

# Copy the rest of the source
COPY . .

EXPOSE 3333

# Run dev server (compose overrides to run prisma generate first)
CMD ["npm", "run", "dev"]


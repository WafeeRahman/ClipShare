# Stage 1: Build stage
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production stage
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

# Copy built app and public assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Next.js needs next binary from node_modules at runtime
COPY --from=builder /app/node_modules/.package-lock.json ./node_modules/.package-lock.json
COPY --from=builder /app/node_modules/next ./node_modules/next
COPY --from=builder /app/node_modules/@next ./node_modules/@next

EXPOSE 3000

CMD ["npm", "start"]

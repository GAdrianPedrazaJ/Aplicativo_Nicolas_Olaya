# Multi-stage Dockerfile to build Vite frontend and run Node backend
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
RUN npm run build

FROM node:18-alpine
WORKDIR /app
# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server source and install only production deps
COPY server ./server
WORKDIR /app/server
RUN npm ci --only=production --legacy-peer-deps || npm install --production --legacy-peer-deps
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "server/index.js"]

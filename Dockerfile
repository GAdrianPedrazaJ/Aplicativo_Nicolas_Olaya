# Multi-stage Dockerfile to build Vite frontend and run Node backend
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
RUN npm run build

FROM node:18-alpine
WORKDIR /app
# Install only production deps for server
COPY server/package.json ./server/
WORKDIR /app/server
RUN npm ci --only=production --legacy-peer-deps || npm install --production --legacy-peer-deps
WORKDIR /app
# Copy built frontend and server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "server/index.js"]

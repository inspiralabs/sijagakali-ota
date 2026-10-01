# sijagakali-ota: dua image — backend (Fastify) dan frontend (statis, nginx).
FROM node:22-bookworm-slim AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS backend
ENV NODE_ENV=production
WORKDIR /app
COPY --from=backend-build --chown=node:node /app/package.json ./
COPY --from=backend-build --chown=node:node /app/node_modules ./node_modules
COPY --from=backend-build --chown=node:node /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]

FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html

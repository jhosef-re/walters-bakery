# syntax=docker/dockerfile:1.6
# ----------------------------------------------------------------------------
# Walters Bakery — Backend (NestJS) production image
# Build context: raiz del monorepo (./)
# ----------------------------------------------------------------------------

ARG NODE_VERSION=20

# ----------------------------------------------------------------------------
# Stage 1: base con Node y tooling minimo
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /repo
ENV CI=true \
    NPM_CONFIG_UPDATE_NOTIFIER=false
RUN apk add --no-cache libc6-compat openssl

# ----------------------------------------------------------------------------
# Stage 2: instala dependencias (incluye dev) y genera el cliente Prisma
# ----------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
RUN cd backend && npx prisma generate

# ----------------------------------------------------------------------------
# Stage 3: build de TypeScript (NestJS) + regeneracion cliente Prisma
# ----------------------------------------------------------------------------
FROM base AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY backend ./backend
RUN cd backend && npx prisma generate && npm run build

# ----------------------------------------------------------------------------
# Stage 4: solo dependencias de produccion (para mantener la imagen pequena)
# ----------------------------------------------------------------------------
FROM base AS prod-deps
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
RUN cd backend && npx prisma generate

# ----------------------------------------------------------------------------
# Stage 5: runtime - imagen final
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production \
    PORT=3000
RUN apk add --no-cache libc6-compat openssl

# Copiamos solo lo necesario desde los stages previos
COPY --from=prod-deps /repo/backend/node_modules ./node_modules
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=build /repo/backend/dist ./dist
COPY --from=build /repo/backend/prisma ./prisma
COPY backend/package.json ./

# Usuario no-root por seguridad
USER node

EXPOSE 3000

# Healthcheck contra /api/health (definido en HealthController)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main.js"]

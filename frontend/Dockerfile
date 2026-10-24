# syntax=docker/dockerfile:1.6
# ----------------------------------------------------------------------------
# Walters Bakery — Frontend (Vite + React) production image
# Build context: raiz del monorepo (./)
# Salida: SPA estatica servida por nginx
# ----------------------------------------------------------------------------

ARG NODE_VERSION=20

# ----------------------------------------------------------------------------
# Stage 1: build de Vite
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /repo
ENV CI=true \
    NPM_CONFIG_UPDATE_NOTIFIER=false
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

WORKDIR /repo/frontend
COPY frontend ./

# VITE_API_URL debe definirse en build-time (queda embebido en el bundle)
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ----------------------------------------------------------------------------
# Stage 2: runtime con nginx sirviendo la SPA
# ----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf
COPY --from=build /repo/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

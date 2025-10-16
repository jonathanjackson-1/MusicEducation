# syntax=docker/dockerfile:1
ARG NODE_VERSION=20-alpine
ARG PNPM_VERSION=8.15.4

FROM node:${NODE_VERSION} AS pnpm-base
ENV PNPM_HOME=/usr/local/share/pnpm \
    PATH="${PNPM_HOME}:/usr/local/bin:${PATH}"
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

FROM pnpm-base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./
RUN pnpm fetch || true

FROM deps AS build
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --offline || pnpm install
RUN pnpm --filter @soundstudio/api build

FROM pnpm-base AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./package.json
CMD ["node", "dist/main.js"]

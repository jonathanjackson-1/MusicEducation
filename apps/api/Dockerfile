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
# syntax=docker/dockerfile:1.5
ARG PNPM_VERSION=9.1.0

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack disable \
  && npm install -g "pnpm@${PNPM_VERSION}"
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm --filter @soundstudio/api... build
RUN pnpm prune --prod

FROM pnpm-base AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./package.json
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY apps/api/package.json ./package.json
COPY apps/api/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]

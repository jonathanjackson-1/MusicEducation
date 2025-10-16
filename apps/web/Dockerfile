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
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm --filter @soundstudio/web... build

FROM pnpm-base AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./.next
COPY apps/web/package.json ./package.json
COPY apps/web/next.config.mjs ./next.config.mjs
COPY apps/web/public ./public
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/web/.next/standalone ./standalone
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./package.json
EXPOSE 3000
CMD ["node", "standalone/apps/web/server.js"]

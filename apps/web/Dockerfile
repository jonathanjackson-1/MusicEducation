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
COPY apps/web ./apps/web
RUN pnpm install --offline || pnpm install
RUN pnpm --filter @soundstudio/web build

FROM pnpm-base AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./.next
COPY apps/web/package.json ./package.json
COPY apps/web/next.config.mjs ./next.config.mjs
COPY apps/web/public ./public
EXPOSE 3000
CMD ["pnpm", "--filter", "@soundstudio/web", "start"]

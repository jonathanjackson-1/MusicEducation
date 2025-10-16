# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8.15.4

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./
RUN pnpm fetch || true

FROM deps AS build
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --offline || pnpm install
RUN pnpm --filter @soundstudio/web build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@8.15.4
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./.next
COPY apps/web/package.json ./package.json
COPY apps/web/next.config.mjs ./next.config.mjs
COPY apps/web/public ./public
EXPOSE 3000
CMD ["pnpm", "--filter", "@soundstudio/web", "start"]

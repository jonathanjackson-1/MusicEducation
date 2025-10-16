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
COPY apps/api ./apps/api
RUN pnpm install --offline || pnpm install
RUN pnpm --filter @soundstudio/api build

FROM node:20-alpine AS production
WORKDIR /app
RUN npm install -g pnpm@8.15.4
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./package.json
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]

# Soundstudio Monorepo

Soundstudio is a pnpm-managed monorepo that powers a multi-platform music education experience across web, mobile, and backend services.

## Structure

- `apps/api` – NestJS backend API.
- `apps/web` – Next.js 14 App Router frontend.
- `apps/mobile` – Expo React Native mobile app.
- `packages/ui` – Shared component library built with shadcn/ui and Tailwind CSS.
- `packages/types` – Shared TypeScript type definitions.
- `packages/config` – Shared ESLint, Prettier, and TypeScript configuration.

## Getting Started

```bash
pnpm install
pnpm dev # run individual app dev scripts from their package directories
```

Refer to each package for additional instructions.

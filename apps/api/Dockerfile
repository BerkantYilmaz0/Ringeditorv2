# ── Stage 1: Build ──
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# workspace root
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# shared paket
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

# api paketi
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/src ./apps/api/src
# bağımlılıkları kur
RUN pnpm install --frozen-lockfile

# shared build
RUN pnpm --filter @ring-planner/shared build

# prisma client oluştur (tsc için gerekli)
RUN pnpm --filter @ring-planner/api prisma:generate

# api build (esbuild bundle yapar)
RUN pnpm --filter @ring-planner/api build

# production deploy klasörü oluştur
RUN pnpm deploy --filter @ring-planner/api --prod /app/api-production

# ── Stage 2: Production ──
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=builder /app/api-production ./
# prisma şeması ve migrationları kopyala
COPY --from=builder /app/apps/api/prisma ./prisma

# production'da prisma client'ı tekrar oluştur (node_modules içine yazar)
RUN npx prisma@6.3.0 generate

EXPOSE 3001
CMD ["node", "dist/index.js"]
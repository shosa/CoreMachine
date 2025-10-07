FROM node:18-alpine AS base

# Install root dependencies
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY apps/backend/package.json apps/backend/
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; fi ;\
  if [ -f package-lock.json ]; then npm install --frozen-lockfile; fi ;\
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; fi

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
RUN chown -R nestjs:nodejs ./node_modules
COPY --from=builder /app/apps/backend/package.json [package.json](http://_vscodecontentref_/1)
COPY --from=builder /app/apps/backend/prisma ./prisma

USER nestjs

EXPOSE 3001

CMD ["node", "dist/main"]

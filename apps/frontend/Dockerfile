FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

COPY apps/frontend/package.json apps/frontend/
COPY apps/frontend/next.config.mjs apps/frontend/
COPY apps/frontend/tsconfig.json apps/frontend/
COPY apps/frontend/src apps/frontend/src/

RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; fi ;\
  if [ -f package-lock.json ]; then npm install --frozen-lockfile; fi ;\
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; fi

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build --workspace=@coremachine/frontend

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/node_modules ./node_modules
COPY apps/frontend/package.json ./package.json

CMD ["npm", "start"]
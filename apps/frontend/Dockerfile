# Stage 1: deps
FROM node:18-alpine AS deps
WORKDIR /app

# Copia i lockfile e package.json principale (root del workspace)
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Copia solo il package.json del frontend
COPY apps/frontend/package.json apps/frontend/

# Installa tutte le dipendenze a livello root (npm workspaces / yarn workspaces)
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  fi

# Stage 2: builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copia tutte le dipendenze dal primo stage
COPY --from=deps /app/node_modules ./node_modules

# Copia tutto il frontend
COPY apps/frontend ./apps/frontend

# Disabilita telemetry Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Build Next.js
WORKDIR /app/apps/frontend
RUN npm run build --workspace=@coremachine/frontend

# Stage 3: runner
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Copia build e dipendenze
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY apps/frontend/package.json ./package.json
COPY apps/frontend/next.config.mjs ./next.config.mjs
COPY apps/frontend/tsconfig.json ./tsconfig.json

EXPOSE 3000

CMD ["npm", "start"]

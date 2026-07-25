# CoachX Backend — multi-stage production image
# Build context MUST be the repository root:
#   docker build -f infrastructure/docker/backend.Dockerfile -t coachx-backend .

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /repo
RUN corepack enable

# ---- Dependencies (full workspace, for building) ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/package.json
COPY backend/package.json ./backend/package.json
COPY database/package.json ./database/package.json
RUN npm ci

# ---- Build ----
FROM deps AS build
COPY shared ./shared
COPY backend ./backend
COPY database ./database
RUN npm run build --workspace=@coachx/shared
RUN npm run build --workspace=@coachx/backend

# ---- Production dependencies only ----
FROM base AS prod-deps
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci --omit=dev --workspace=@coachx/shared --workspace=@coachx/backend

# ---- Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
RUN addgroup -S coachx && adduser -S coachx -G coachx

COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/shared/node_modules ./shared/node_modules
COPY --from=prod-deps /repo/backend/node_modules ./backend/node_modules
COPY --from=build /repo/shared/dist ./shared/dist
COPY --from=build /repo/shared/package.json ./shared/package.json
COPY --from=build /repo/backend/dist ./backend/dist
COPY --from=build /repo/backend/package.json ./backend/package.json

USER coachx
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/api/v1/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "backend/dist/server.js"]

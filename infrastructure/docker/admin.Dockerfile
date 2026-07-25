# CoachX Admin Portal — static build served by Nginx
# Build context MUST be the repository root:
#   docker build -f infrastructure/docker/admin.Dockerfile -t coachx-admin .

FROM node:20-alpine AS deps
WORKDIR /repo
RUN corepack enable
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/package.json
COPY admin/package.json ./admin/package.json
RUN npm ci

FROM deps AS build
COPY shared ./shared
COPY admin ./admin
RUN npm run build --workspace=@coachx/shared
RUN npm run build --workspace=@coachx/admin

FROM nginx:1.27-alpine AS runtime
COPY infrastructure/docker/nginx.spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/admin/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1

FROM node:20-slim AS frontend-builder
WORKDIR /app/web
ARG BUILD_DATE
ENV BUILD_DATE=${BUILD_DATE:-unknown}
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY web/package.json ./
COPY web ./
RUN pnpm install
RUN pnpm build

FROM golang:1.25-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o nexus ./cmd/server/main.go

FROM node:20-slim
WORKDIR /app

COPY --from=backend-builder /app/nexus .
COPY --from=frontend-builder /app/web/.next/standalone ./
COPY --from=frontend-builder /app/web/public ./public
COPY --from=frontend-builder /app/web/.next/static ./_next/static
RUN mkdir -p /app/data

ENV PORT=8080
ENV API_PORT=8081

EXPOSE 8080

CMD ["sh", "-c", "./nexus & node server.js"]

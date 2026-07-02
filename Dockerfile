# syntax=docker/dockerfile:1

# 1) Build the frontend on the native build platform (arch-independent assets).
FROM --platform=$BUILDPLATFORM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# 2) Cross-compile the Go binary for the target arch, embedding the frontend.
FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=web /web/dist ./web/dist
ARG TARGETOS TARGETARCH VERSION=docker
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -trimpath -ldflags "-s -w -X main.version=${VERSION}" -o /out/cossmos .

# 3) Minimal runtime image — a single static binary plus CA roots.
FROM alpine:3.20 AS runtime
RUN apk add --no-cache ca-certificates tzdata wget \
    && adduser -D -u 10001 cossmos \
    && mkdir -p /app/data && chown -R cossmos:cossmos /app
WORKDIR /app
COPY --from=build /out/cossmos /usr/local/bin/cossmos
COPY config.yaml /app/config.yaml
USER cossmos
EXPOSE 8080
ENV COSSMOS_MODE=serve \
    COSSMOS_CONFIG=/app/config.yaml \
    COSSMOS_DATA=/app/data/history.json \
    COSSMOS_LISTEN=:8080
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=8s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/healthz >/dev/null 2>&1 || exit 1
ENTRYPOINT ["cossmos"]

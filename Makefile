VERSION ?= dev
BIN := cossmos
LDFLAGS := -s -w -X main.version=$(VERSION)

.PHONY: all web build build-go run once test lint tidy docker clean

all: build

## web: install deps and build the frontend bundle
web:
	cd web && npm ci && npm run build

## build: build the frontend then the embedded Go binary
build: web build-go

## build-go: build only the Go binary (expects web/dist to exist)
build-go:
	go build -trimpath -ldflags "$(LDFLAGS)" -o $(BIN) .

## run: build and run in continuous serve mode (needs config.yaml)
run: build
	./$(BIN) -mode serve -config config.yaml

## once: build and run a single round, writing status.json to ./public
once: build-go
	./$(BIN) -mode once -config config.yaml -out public

## test: run Go tests and the frontend typecheck
test:
	go test ./... -race
	cd web && npm run typecheck

## lint: vet Go and lint the frontend
lint:
	go vet ./...
	cd web && npm run lint

## tidy: tidy Go modules
tidy:
	go mod tidy

## docker: build the container image
docker:
	docker build -t cossmos:$(VERSION) .

## clean: remove build artifacts
clean:
	rm -f $(BIN)
	rm -rf web/dist/* public data
	touch web/dist/.gitkeep

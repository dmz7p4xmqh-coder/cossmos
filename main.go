// Command cossmos is a lightweight service status monitor with two run modes:
//
//	serve  continuously checks services on a schedule, serves a JSON API and the
//	       embedded web UI. Suited to a long-running container.
//	once   runs a single round of checks, writes status.json (and persists
//	       history) and exits without starting any server. Suited to a scheduled
//	       GitHub Actions job that publishes to GitHub Pages.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/normal-ex/cossmos/internal/config"
	"github.com/normal-ex/cossmos/internal/monitor"
	"github.com/normal-ex/cossmos/internal/server"
	"github.com/normal-ex/cossmos/web"
)

// version is overridable at build time: -ldflags "-X main.version=1.2.3".
var version = "dev"

func main() {
	log.SetFlags(log.LstdFlags | log.Lmsgprefix)
	log.SetPrefix("[cossmos] ")

	var (
		mode       = flag.String("mode", env("COSSMOS_MODE", ""), "run mode: serve | once")
		configPath = flag.String("config", env("COSSMOS_CONFIG", "config.yaml"), "path to config file")
		outDir     = flag.String("out", env("COSSMOS_OUT", "public"), "once mode: directory to write status.json")
		dataPath   = flag.String("data", env("COSSMOS_DATA", "data/history.json"), "history persistence file")
		listen     = flag.String("listen", env("COSSMOS_LISTEN", ""), "serve mode: override listen address")
		showVer    = flag.Bool("version", false, "print version and exit")
	)
	flag.Parse()

	if *showVer {
		fmt.Printf("cossmos %s\n", version)
		return
	}

	resolvedMode := resolveMode(*mode)
	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	if *listen != "" {
		cfg.Server.Listen = *listen
	}

	store := monitor.NewStore(cfg.Monitor.HistorySize)
	if err := store.Load(*dataPath); err != nil {
		log.Printf("warning: could not load history from %s: %v", *dataPath, err)
	}
	mon := monitor.New(cfg, store, version)

	switch resolvedMode {
	case "once":
		runOnce(mon, store, *outDir, *dataPath)
	case "serve":
		runServe(mon, store, cfg, *dataPath)
	default:
		log.Fatalf("unknown mode %q (want serve or once)", resolvedMode)
	}
}

// resolveMode picks the run mode, auto-selecting once when running inside a
// GitHub Actions job and no explicit mode was requested.
func resolveMode(mode string) string {
	mode = strings.ToLower(strings.TrimSpace(mode))
	if mode != "" {
		return mode
	}
	if os.Getenv("GITHUB_ACTIONS") == "true" {
		return "once"
	}
	return "serve"
}

func runOnce(mon *monitor.Monitor, store *monitor.Store, outDir, dataPath string) {
	log.Printf("running single check round (once mode)")
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	snap := mon.RunOnce(ctx)

	if err := os.MkdirAll(outDir, 0o755); err != nil {
		log.Fatalf("create out dir: %v", err)
	}
	outFile := filepath.Join(outDir, "status.json")
	raw, err := json.MarshalIndent(snap, "", "  ")
	if err != nil {
		log.Fatalf("encode snapshot: %v", err)
	}
	if err := os.WriteFile(outFile, raw, 0o644); err != nil {
		log.Fatalf("write %s: %v", outFile, err)
	}
	if err := store.Save(dataPath); err != nil {
		log.Printf("warning: could not save history to %s: %v", dataPath, err)
	}

	log.Printf("wrote %s (overall=%s, up=%d degraded=%d down=%d, avgUptime=%.1f%%)",
		outFile, snap.Overall, snap.Stats.Up, snap.Stats.Degraded, snap.Stats.Down, snap.Stats.AvgUptime)
}

func runServe(mon *monitor.Monitor, store *monitor.Store, cfg *config.Config, dataPath string) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go mon.Run(ctx)
	go persistLoop(ctx, store, dataPath, time.Duration(cfg.Monitor.IntervalSec)*time.Second)

	srv := &http.Server{
		Addr:              cfg.Server.Listen,
		Handler:           server.New(mon, web.Assets()).Handler(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("cossmos %s serving on %s (checking %d services every %ds)",
			version, cfg.Server.Listen, len(cfg.Services), cfg.Monitor.IntervalSec)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("http server: %v", err)
		}
	}()

	<-ctx.Done()
	log.Printf("shutting down...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
	if err := store.Save(dataPath); err != nil {
		log.Printf("warning: could not save history on shutdown: %v", err)
	}
}

// persistLoop periodically saves history so a crash loses at most one interval.
func persistLoop(ctx context.Context, store *monitor.Store, dataPath string, every time.Duration) {
	if every < 30*time.Second {
		every = 30 * time.Second
	}
	ticker := time.NewTicker(every)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := store.Save(dataPath); err != nil {
				log.Printf("warning: periodic history save failed: %v", err)
			}
		}
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

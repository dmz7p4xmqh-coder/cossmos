// Package server exposes the monitor over HTTP: a small JSON API plus the
// embedded single-page frontend. It is only used in serve (continuous) mode.
package server

import (
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/normal-ex/cossmos/internal/model"
)

// Provider yields the current snapshot. *monitor.Monitor satisfies this.
type Provider interface {
	Snapshot() *model.Snapshot
}

// Server wires the API and static assets onto an http.Handler.
type Server struct {
	provider   Provider
	assets     fs.FS
	fileServer http.Handler
	hasIndex   bool
}

// New constructs a Server. assets is the embedded frontend filesystem rooted at
// the directory that contains index.html (may be empty during development).
func New(provider Provider, assets fs.FS) *Server {
	s := &Server{provider: provider, assets: assets}
	if assets != nil {
		if _, err := fs.Stat(assets, "index.html"); err == nil {
			s.hasIndex = true
		}
		s.fileServer = http.FileServer(http.FS(assets))
	}
	return s
}

// Handler returns the root http.Handler.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/status", s.handleStatus)
	mux.HandleFunc("/status.json", s.handleStatus)
	mux.HandleFunc("/api/healthz", s.handleHealth)
	mux.HandleFunc("/", s.handleStatic)
	return logRequests(securityHeaders(mux))
}

func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	snap := s.provider.Snapshot()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if snap == nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"error": "no data yet"})
		return
	}
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	enc.Encode(snap)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(map[string]any{"ok": true, "time": time.Now().UTC()})
}

// handleStatic serves embedded assets. Missing paths fall back to index.html so
// client-side routes resolve (single-page application behaviour).
func (s *Server) handleStatic(w http.ResponseWriter, r *http.Request) {
	if !s.hasIndex {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write([]byte("Cossmos is running.\nThe frontend bundle is not embedded in this build.\nAPI: /api/status"))
		return
	}
	upath := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
	if upath == "" {
		upath = "index.html"
	}
	if f, err := s.assets.Open(upath); err == nil {
		f.Close()
		s.fileServer.ServeHTTP(w, r)
		return
	}
	// Unknown path: rewrite to index.html for SPA routing.
	r2 := r.Clone(r.Context())
	r2.URL.Path = "/"
	s.fileServer.ServeHTTP(w, r2)
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}

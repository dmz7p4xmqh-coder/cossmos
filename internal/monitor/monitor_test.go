package monitor

import (
	"testing"
	"time"

	"github.com/normal-ex/cossmos/internal/config"
	"github.com/normal-ex/cossmos/internal/model"
)

func TestBuildSnapshotHidesTargets(t *testing.T) {
	cfg := &config.Config{
		Site: model.SiteInfo{Title: "Test", HideTargets: true},
		Services: []config.Service{
			{Name: "web", Type: config.CheckHTTP, URL: "https://example.com"},
			{Name: "db", Type: config.CheckTCP, Host: "10.0.0.5", Port: 5432},
		},
	}
	m := New(cfg, NewStore(5), "test")

	snap := m.buildSnapshot(time.Now().UTC(), []Result{
		{Status: model.StatusDown, ResponseMS: 42, Message: "dial tcp example.com:443: timeout"},
		{Status: model.StatusDown, ResponseMS: 8, Message: "dial tcp 10.0.0.5:5432: timeout"},
	})

	for _, svc := range snap.Services {
		if svc.URL != "" {
			t.Fatalf("service %q URL = %q, want hidden", svc.Name, svc.URL)
		}
		if svc.Message != "check failed" {
			t.Fatalf("service %q message = %q, want sanitized failure", svc.Name, svc.Message)
		}
	}
}

func TestBuildSnapshotKeepsTargetsByDefault(t *testing.T) {
	cfg := &config.Config{
		Site: model.SiteInfo{Title: "Test"},
		Services: []config.Service{
			{Name: "web", Type: config.CheckHTTP, URL: "https://example.com"},
			{Name: "db", Type: config.CheckTCP, Host: "10.0.0.5", Port: 5432},
		},
	}
	m := New(cfg, NewStore(5), "test")

	snap := m.buildSnapshot(time.Now().UTC(), []Result{
		{Status: model.StatusUp, ResponseMS: 42},
		{Status: model.StatusUp, ResponseMS: 8},
	})

	got := map[string]string{}
	for _, svc := range snap.Services {
		got[svc.Name] = svc.URL
	}
	if got["web"] != "https://example.com" {
		t.Fatalf("web URL = %q, want https://example.com", got["web"])
	}
	if got["db"] != "10.0.0.5:5432" {
		t.Fatalf("db URL = %q, want 10.0.0.5:5432", got["db"])
	}
}

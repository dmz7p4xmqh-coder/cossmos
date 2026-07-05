package config

import (
	"os"
	"path/filepath"
	"testing"
)

func writeTemp(t *testing.T, body string) string {
	t.Helper()
	dir := t.TempDir()
	p := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(p, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	return p
}

func TestLoadDefaults(t *testing.T) {
	p := writeTemp(t, `
site:
  title: "Test"
  icp: "京ICP备1号"
  refreshInterval: 120
  hideTargets: true
services:
  - name: "web"
    url: "https://example.com"
`)
	c, err := Load(p)
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if c.Monitor.IntervalSec != 60 {
		t.Errorf("interval default = %d, want 60", c.Monitor.IntervalSec)
	}
	if c.Monitor.HistorySize != 60 {
		t.Errorf("historySize default = %d, want 60", c.Monitor.HistorySize)
	}
	svc := c.Services[0]
	if svc.Type != CheckHTTP {
		t.Errorf("type inferred = %q, want http", svc.Type)
	}
	if svc.Method != "GET" {
		t.Errorf("method default = %q, want GET", svc.Method)
	}
	if c.Site.RefreshInterval != 120 {
		t.Errorf("refreshInterval = %d, want 120 (yaml tag must match camelCase)", c.Site.RefreshInterval)
	}
	if !c.Site.HideTargets {
		t.Errorf("hideTargets = false, want true (yaml tag must match camelCase)")
	}
	if c.Site.ICPLink == "" {
		t.Errorf("icpLink should be auto-filled when icp is set")
	}
}

func TestValidateErrors(t *testing.T) {
	cases := map[string]string{
		"no services": `site: {title: x}`,
		"http no url":  "services:\n  - name: a\n    type: http\n",
		"tcp no port":  "services:\n  - name: a\n    type: tcp\n    host: h\n",
		"dup name":     "services:\n  - name: a\n    url: https://x\n  - name: a\n    url: https://y\n",
	}
	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			p := writeTemp(t, body)
			if _, err := Load(p); err == nil {
				t.Errorf("expected error for %q config", name)
			}
		})
	}
}

func TestServiceID(t *testing.T) {
	a := Service{Name: "web"}
	b := Service{Name: "web"}
	if a.ID() != b.ID() {
		t.Errorf("ID not stable across equal names")
	}
	other := Service{Name: "other"}
	if other.ID() == a.ID() {
		t.Errorf("ID collision for different names")
	}
}

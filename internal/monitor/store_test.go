package monitor

import (
	"path/filepath"
	"testing"
	"time"

	"github.com/normal-ex/cossmos/internal/model"
)

func TestStoreTrimsToSize(t *testing.T) {
	s := NewStore(3)
	for i := 0; i < 10; i++ {
		s.Append("svc", model.CheckPoint{Timestamp: time.Now(), Status: model.StatusUp})
	}
	if got := len(s.History("svc")); got != 3 {
		t.Errorf("history len = %d, want 3 (trimmed)", got)
	}
}

func TestStoreUptime(t *testing.T) {
	s := NewStore(10)
	s.Append("svc", model.CheckPoint{Status: model.StatusUp})
	s.Append("svc", model.CheckPoint{Status: model.StatusDegraded}) // counts as available
	s.Append("svc", model.CheckPoint{Status: model.StatusDown})
	s.Append("svc", model.CheckPoint{Status: model.StatusDown})
	if got := s.Uptime("svc"); got != 50 {
		t.Errorf("uptime = %.1f, want 50", got)
	}
	if got := s.Uptime("missing"); got != 100 {
		t.Errorf("uptime for empty = %.1f, want 100", got)
	}
}

func TestStorePersistRoundTrip(t *testing.T) {
	path := filepath.Join(t.TempDir(), "nested", "history.json")
	s := NewStore(5)
	s.Append("svc", model.CheckPoint{Status: model.StatusUp, ResponseMS: 42})
	if err := s.Save(path); err != nil {
		t.Fatalf("save: %v", err)
	}
	s2 := NewStore(5)
	if err := s2.Load(path); err != nil {
		t.Fatalf("load: %v", err)
	}
	h := s2.History("svc")
	if len(h) != 1 || h[0].ResponseMS != 42 {
		t.Errorf("round-trip mismatch: %+v", h)
	}
}

func TestStoreLoadMissingFileIsOK(t *testing.T) {
	s := NewStore(5)
	if err := s.Load(filepath.Join(t.TempDir(), "nope.json")); err != nil {
		t.Errorf("loading missing file should be nil, got %v", err)
	}
}

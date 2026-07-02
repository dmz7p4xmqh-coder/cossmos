package monitor

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/normal-ex/cossmos/internal/model"
)

// Store holds the rolling check history per service. It is safe for concurrent
// use and can be persisted to disk so history survives restarts (serve mode)
// and survives between scheduled runs (once mode via a cached data file).
type Store struct {
	mu          sync.RWMutex
	historySize int
	histories   map[string][]model.CheckPoint
}

// persisted is the on-disk representation.
type persisted struct {
	Version   int                             `json:"version"`
	SavedAt   time.Time                       `json:"savedAt"`
	Histories map[string][]model.CheckPoint   `json:"histories"`
}

// NewStore creates an empty store keeping at most historySize points per service.
func NewStore(historySize int) *Store {
	if historySize <= 0 {
		historySize = 60
	}
	return &Store{
		historySize: historySize,
		histories:   make(map[string][]model.CheckPoint),
	}
}

// Append records a new measurement for a service, trimming to the configured size.
func (s *Store) Append(id string, p model.CheckPoint) {
	s.mu.Lock()
	defer s.mu.Unlock()
	h := append(s.histories[id], p)
	if len(h) > s.historySize {
		h = h[len(h)-s.historySize:]
	}
	s.histories[id] = h
}

// History returns a copy of the kept points for a service.
func (s *Store) History(id string) []model.CheckPoint {
	s.mu.RLock()
	defer s.mu.RUnlock()
	src := s.histories[id]
	out := make([]model.CheckPoint, len(src))
	copy(out, src)
	return out
}

// Uptime returns the percentage of non-down points in a service's history.
func (s *Store) Uptime(id string) float64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	h := s.histories[id]
	if len(h) == 0 {
		return 100
	}
	up := 0
	for _, p := range h {
		if p.Status == model.StatusUp || p.Status == model.StatusDegraded {
			up++
		}
	}
	return float64(up) / float64(len(h)) * 100
}

// Load reads a previously persisted store from disk. A missing file is not an
// error: it simply yields an empty store.
func (s *Store) Load(path string) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	var p persisted
	if err := json.Unmarshal(raw, &p); err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if p.Histories != nil {
		// Trim on load in case historySize shrank since the file was written.
		for id, h := range p.Histories {
			if len(h) > s.historySize {
				h = h[len(h)-s.historySize:]
			}
			s.histories[id] = h
		}
	}
	return nil
}

// Save atomically writes the store to disk, creating parent directories.
func (s *Store) Save(path string) error {
	s.mu.RLock()
	snapshot := persisted{
		Version:   1,
		SavedAt:   time.Now().UTC(),
		Histories: s.histories,
	}
	raw, err := json.MarshalIndent(snapshot, "", "  ")
	s.mu.RUnlock()
	if err != nil {
		return err
	}
	if dir := filepath.Dir(path); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, raw, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

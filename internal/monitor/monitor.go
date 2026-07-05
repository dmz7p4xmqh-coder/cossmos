package monitor

import (
	"context"
	"sort"
	"sync"
	"time"

	"github.com/normal-ex/cossmos/internal/config"
	"github.com/normal-ex/cossmos/internal/model"
)

// Monitor ties together the config, the checker and the history store, and can
// either run a single round (once mode) or loop on a ticker (serve mode).
type Monitor struct {
	cfg     *config.Config
	store   *Store
	version string

	mu   sync.RWMutex
	last *model.Snapshot
}

// New builds a Monitor.
func New(cfg *config.Config, store *Store, version string) *Monitor {
	return &Monitor{cfg: cfg, store: store, version: version}
}

// Store exposes the underlying history store (for persistence).
func (m *Monitor) Store() *Store { return m.store }

// RunOnce probes every service concurrently, records results into the store and
// returns a fresh snapshot. It also caches the snapshot as the latest.
func (m *Monitor) RunOnce(ctx context.Context) *model.Snapshot {
	results := make([]Result, len(m.cfg.Services))
	sem := make(chan struct{}, m.cfg.Monitor.Concurrency)
	var wg sync.WaitGroup

	for i := range m.cfg.Services {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			results[i] = Check(ctx, &m.cfg.Services[i])
		}(i)
	}
	wg.Wait()

	now := time.Now().UTC()
	for i := range m.cfg.Services {
		svc := &m.cfg.Services[i]
		m.store.Append(svc.ID(), model.CheckPoint{
			Timestamp:  now,
			Status:     results[i].Status,
			ResponseMS: results[i].ResponseMS,
		})
	}

	snap := m.buildSnapshot(now, results)
	m.mu.Lock()
	m.last = snap
	m.mu.Unlock()
	return snap
}

// Snapshot returns the most recently produced snapshot, or nil if none yet.
func (m *Monitor) Snapshot() *model.Snapshot {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.last
}

// Run loops until the context is cancelled, probing every configured interval.
// It runs an immediate round before the first tick.
func (m *Monitor) Run(ctx context.Context) {
	m.RunOnce(ctx)
	ticker := time.NewTicker(time.Duration(m.cfg.Monitor.IntervalSec) * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			m.RunOnce(ctx)
		}
	}
}

func (m *Monitor) buildSnapshot(now time.Time, results []Result) *model.Snapshot {
	services := make([]model.Service, 0, len(m.cfg.Services))
	var stats model.Stats
	var uptimeSum float64

	for i := range m.cfg.Services {
		svc := &m.cfg.Services[i]
		res := results[i]
		id := svc.ID()
		uptime := m.store.Uptime(id)
		uptimeSum += uptime
		target := svc.Target()
		message := res.Message
		if m.cfg.Site.HideTargets {
			target = ""
			if res.Status == model.StatusDown {
				message = "check failed"
			}
		}

		services = append(services, model.Service{
			ID:          id,
			Name:        svc.Name,
			Group:       svc.Group,
			URL:         target,
			Description: svc.Description,
			Status:      res.Status,
			ResponseMS:  res.ResponseMS,
			Uptime:      round1(uptime),
			LastChecked: now,
			Message:     message,
			CertExpiry:  res.CertExpiry,
			History:     m.store.History(id),
		})

		stats.Total++
		switch res.Status {
		case model.StatusUp:
			stats.Up++
		case model.StatusDegraded:
			stats.Degraded++
		case model.StatusDown:
			stats.Down++
		}
	}

	if stats.Total > 0 {
		stats.AvgUptime = round1(uptimeSum / float64(stats.Total))
	}

	overall := model.StatusUp
	switch {
	case stats.Down > 0:
		overall = model.StatusDown
	case stats.Degraded > 0:
		overall = model.StatusDegraded
	}

	// Stable ordering: keep config order but ensure groups stay together.
	sort.SliceStable(services, func(i, j int) bool {
		return services[i].Group < services[j].Group
	})

	return &model.Snapshot{
		Generator: "cossmos",
		Version:   m.version,
		UpdatedAt: now,
		Overall:   overall,
		Stats:     stats,
		Site:      m.cfg.Site,
		Services:  services,
	}
}

func round1(f float64) float64 {
	return float64(int(f*10+0.5)) / 10
}

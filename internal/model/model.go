// Package model defines the shared data contract produced by both the
// continuous (serve) and one-shot (once) run modes. The frontend consumes
// exactly this JSON shape regardless of which mode generated it.
package model

import "time"

// Status is the health state of a service or of the whole system.
type Status string

const (
	StatusUp       Status = "up"       // fully operational
	StatusDegraded Status = "degraded" // reachable but slow or partially failing
	StatusDown     Status = "down"     // check failed
	StatusPending  Status = "pending"  // not checked yet
)

// CheckPoint is a single historical measurement. Field names are kept short
// because many of these are serialised per service.
type CheckPoint struct {
	Timestamp  time.Time `json:"t"`
	Status     Status    `json:"s"`
	ResponseMS int64     `json:"r"`
}

// Service is the current state plus recent history of one monitored target.
type Service struct {
	ID                 string       `json:"id"`
	Name               string       `json:"name"`
	Group              string       `json:"group,omitempty"`
	URL                string       `json:"url,omitempty"`
	Description        string       `json:"description,omitempty"`
	Status             Status       `json:"status"`
	ResponseMS         int64        `json:"responseMs"`
	Uptime             float64      `json:"uptime"` // percentage (0-100) over the kept history window
	LastChecked        time.Time    `json:"lastChecked"`
	Message            string       `json:"message,omitempty"`
	CertExpiry         *time.Time   `json:"certExpiry,omitempty"` // TLS certificate expiry (HTTPS only)
	Maintenance        bool         `json:"maintenance,omitempty"`
	MaintenanceMessage string       `json:"maintenanceMessage,omitempty"`
	History            []CheckPoint `json:"history"`
}

// SiteInfo carries presentation-level settings the frontend renders, including
// the Chinese ICP / public-security filing numbers (备案号). It is both the
// YAML config shape (yaml tags) and the JSON wire shape (json tags), so both
// sets of tags must stay in sync.
type SiteInfo struct {
	Title           string `json:"title" yaml:"title"`
	Description     string `json:"description,omitempty" yaml:"description"`
	Logo            string `json:"logo,omitempty" yaml:"logo"`         // logo URL or data URI
	LogoDark        string `json:"logoDark,omitempty" yaml:"logoDark"` // dark-mode logo variant
	ICP             string `json:"icp,omitempty" yaml:"icp"`               // ICP 备案号
	ICPLink         string `json:"icpLink,omitempty" yaml:"icpLink"`       // 工信部备案查询链接
	PoliceICP       string `json:"policeIcp,omitempty" yaml:"policeIcp"`   // 公安备案号
	PoliceICPLink   string `json:"policeIcpLink,omitempty" yaml:"policeIcpLink"`
	Footer          string `json:"footer,omitempty" yaml:"footer"`
	GitHub          string `json:"github,omitempty" yaml:"github"`
	HideTargets     bool   `json:"hideTargets,omitempty" yaml:"hideTargets"` // hide service URLs/IPs from public status output
	RefreshInterval int    `json:"refreshInterval" yaml:"refreshInterval"`   // frontend auto-refresh seconds (serve mode)
}

// Stats is a roll-up the frontend shows in the header.
type Stats struct {
	Total     int     `json:"total"`
	Up        int     `json:"up"`
	Degraded  int     `json:"degraded"`
	Down      int     `json:"down"`
	AvgUptime float64 `json:"avgUptime"`
}

// Snapshot is the top-level document served as status.json / GET /api/status.
type Snapshot struct {
	Generator string    `json:"generator"`
	Version   string    `json:"version"`
	UpdatedAt time.Time `json:"updatedAt"`
	Overall   Status    `json:"overall"`
	Stats     Stats     `json:"stats"`
	Site      SiteInfo  `json:"site"`
	Services  []Service `json:"services"`
}

// Package config loads and validates the YAML configuration that drives the
// monitor. It applies sensible defaults so a minimal config still works.
package config

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"os"
	"strings"

	"github.com/normal-ex/cossmos/internal/model"
	"gopkg.in/yaml.v3"
)

// CheckType enumerates the supported probe kinds.
type CheckType string

const (
	CheckHTTP CheckType = "http"
	CheckTCP  CheckType = "tcp"
)

// Service is a single monitored target as expressed in YAML.
type Service struct {
	Name        string    `yaml:"name"`
	Group       string    `yaml:"group"`
	Description string    `yaml:"description"`
	Type        CheckType `yaml:"type"`

	// HTTP options.
	URL          string            `yaml:"url"`
	Method       string            `yaml:"method"`
	ExpectStatus []int             `yaml:"expectStatus"`
	Keyword      string            `yaml:"keyword"`     // body must contain this substring
	Headers      map[string]string `yaml:"headers"`
	Insecure     bool              `yaml:"insecure"`    // skip TLS verification
	FollowRedirect *bool           `yaml:"followRedirect"`

	// TCP options.
	Host string `yaml:"host"`
	Port int    `yaml:"port"`

	// Shared.
	DegradedMs int `yaml:"degradedMs"` // slower than this (ms) => degraded
	TimeoutSec int `yaml:"timeout"`    // per-service timeout override (seconds)
}

// Monitor holds scheduler-level tuning.
type Monitor struct {
	IntervalSec  int `yaml:"interval"`    // seconds between rounds (serve mode)
	TimeoutSec   int `yaml:"timeout"`     // default per-check timeout (seconds)
	HistorySize  int `yaml:"historySize"` // number of points kept per service
	Concurrency  int `yaml:"concurrency"` // max parallel checks
}

// Server holds the HTTP listener settings (serve mode only).
type Server struct {
	Listen string `yaml:"listen"`
}

// Config is the whole document.
type Config struct {
	Site     model.SiteInfo `yaml:"site"`
	Monitor  Monitor        `yaml:"monitor"`
	Server   Server         `yaml:"server"`
	Services []Service      `yaml:"services"`
}

// Load reads, parses and validates a config file from disk.
func Load(path string) (*Config, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}
	var c Config
	if err := yaml.Unmarshal(raw, &c); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}
	c.applyDefaults()
	if err := c.validate(); err != nil {
		return nil, err
	}
	return &c, nil
}

func (c *Config) applyDefaults() {
	if c.Monitor.IntervalSec <= 0 {
		c.Monitor.IntervalSec = 60
	}
	if c.Monitor.TimeoutSec <= 0 {
		c.Monitor.TimeoutSec = 10
	}
	if c.Monitor.HistorySize <= 0 {
		c.Monitor.HistorySize = 60
	}
	if c.Monitor.Concurrency <= 0 {
		c.Monitor.Concurrency = 8
	}
	if c.Server.Listen == "" {
		c.Server.Listen = ":8080"
	}
	if c.Site.Title == "" {
		c.Site.Title = "Cossmos Status"
	}
	if c.Site.RefreshInterval <= 0 {
		c.Site.RefreshInterval = 60
	}
	if c.Site.ICPLink == "" && c.Site.ICP != "" {
		c.Site.ICPLink = "https://beian.miit.gov.cn/"
	}

	for i := range c.Services {
		s := &c.Services[i]
		if s.Type == "" {
			if s.URL != "" {
				s.Type = CheckHTTP
			} else if s.Host != "" {
				s.Type = CheckTCP
			}
		}
		s.Type = CheckType(strings.ToLower(string(s.Type)))
		if s.Type == CheckHTTP {
			if s.Method == "" {
				s.Method = "GET"
			}
			s.Method = strings.ToUpper(s.Method)
			if len(s.ExpectStatus) == 0 {
				s.ExpectStatus = []int{200, 201, 202, 203, 204, 301, 302, 307, 308}
			}
		}
		if s.DegradedMs <= 0 {
			s.DegradedMs = 1500
		}
		if s.TimeoutSec <= 0 {
			s.TimeoutSec = c.Monitor.TimeoutSec
		}
	}
}

func (c *Config) validate() error {
	if len(c.Services) == 0 {
		return fmt.Errorf("config has no services")
	}
	seen := map[string]bool{}
	for i := range c.Services {
		s := &c.Services[i]
		if s.Name == "" {
			return fmt.Errorf("service #%d has no name", i+1)
		}
		if seen[s.Name] {
			return fmt.Errorf("duplicate service name %q", s.Name)
		}
		seen[s.Name] = true
		switch s.Type {
		case CheckHTTP:
			if s.URL == "" {
				return fmt.Errorf("service %q: http check requires url", s.Name)
			}
		case CheckTCP:
			if s.Host == "" || s.Port == 0 {
				return fmt.Errorf("service %q: tcp check requires host and port", s.Name)
			}
		default:
			return fmt.Errorf("service %q: unknown type %q (want http or tcp)", s.Name, s.Type)
		}
	}
	return nil
}

// ID returns a stable identifier for a service derived from its name, used to
// match history across runs even if ordering changes.
func (s *Service) ID() string {
	sum := sha1.Sum([]byte(s.Name))
	return hex.EncodeToString(sum[:])[:12]
}

// Target is a human-readable description of what is probed.
func (s *Service) Target() string {
	if s.Type == CheckTCP {
		return fmt.Sprintf("%s:%d", s.Host, s.Port)
	}
	return s.URL
}

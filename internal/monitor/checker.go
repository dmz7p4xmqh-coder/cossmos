package monitor

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/normal-ex/cossmos/internal/config"
	"github.com/normal-ex/cossmos/internal/model"
)

// Result is the outcome of probing a single service once.
type Result struct {
	Status     model.Status
	ResponseMS int64
	Message    string
	CertExpiry *time.Time // TLS leaf certificate NotAfter (HTTPS only)
}

// Check probes one service and returns its current status. It never returns an
// error: failures are encoded as a Down result with a human-readable message.
func Check(ctx context.Context, svc *config.Service) Result {
	switch svc.Type {
	case config.CheckTCP:
		return checkTCP(ctx, svc)
	default:
		return checkHTTP(ctx, svc)
	}
}

func checkHTTP(ctx context.Context, svc *config.Service) Result {
	timeout := time.Duration(svc.TimeoutSec) * time.Second
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	transport := &http.Transport{
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: svc.Insecure},
		DisableKeepAlives:   true,
		MaxIdleConns:        1,
		TLSHandshakeTimeout: timeout,
	}
	client := &http.Client{
		Transport: transport,
		Timeout:   timeout,
	}
	// By default follow redirects; allow opting out to assert on 3xx codes.
	if svc.FollowRedirect != nil && !*svc.FollowRedirect {
		client.CheckRedirect = func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		}
	}

	req, err := http.NewRequestWithContext(ctx, svc.Method, svc.URL, nil)
	if err != nil {
		return Result{Status: model.StatusDown, Message: "bad request: " + err.Error()}
	}
	req.Header.Set("User-Agent", "Cossmos/health-check")
	for k, v := range svc.Headers {
		req.Header.Set(k, v)
	}

	start := time.Now()
	resp, err := client.Do(req)
	elapsed := time.Since(start).Milliseconds()
	if err != nil {
		return Result{Status: model.StatusDown, ResponseMS: elapsed, Message: trimErr(err)}
	}
	defer resp.Body.Close()

	// Capture the TLS leaf certificate expiry for HTTPS endpoints.
	var certExpiry *time.Time
	if resp.TLS != nil && len(resp.TLS.PeerCertificates) > 0 {
		exp := resp.TLS.PeerCertificates[0].NotAfter
		certExpiry = &exp
	}

	body, keyword := "", svc.Keyword
	if keyword != "" {
		// Read a bounded amount so a huge body cannot exhaust memory.
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		body = string(b)
	} else {
		io.Copy(io.Discard, io.LimitReader(resp.Body, 1<<16))
	}

	if !statusAllowed(resp.StatusCode, svc.ExpectStatus) {
		return Result{
			Status:     model.StatusDown,
			ResponseMS: elapsed,
			Message:    fmt.Sprintf("unexpected status %d", resp.StatusCode),
			CertExpiry: certExpiry,
		}
	}
	if keyword != "" && !strings.Contains(body, keyword) {
		return Result{
			Status:     model.StatusDown,
			ResponseMS: elapsed,
			Message:    "keyword not found in body",
			CertExpiry: certExpiry,
		}
	}
	if elapsed >= int64(svc.DegradedMs) {
		return Result{
			Status:     model.StatusDegraded,
			ResponseMS: elapsed,
			Message:    fmt.Sprintf("slow response %dms", elapsed),
			CertExpiry: certExpiry,
		}
	}
	return Result{
		Status:     model.StatusUp,
		ResponseMS: elapsed,
		Message:    fmt.Sprintf("HTTP %d", resp.StatusCode),
		CertExpiry: certExpiry,
	}
}

func checkTCP(ctx context.Context, svc *config.Service) Result {
	timeout := time.Duration(svc.TimeoutSec) * time.Second
	d := net.Dialer{Timeout: timeout}
	addr := fmt.Sprintf("%s:%d", svc.Host, svc.Port)

	start := time.Now()
	conn, err := d.DialContext(ctx, "tcp", addr)
	elapsed := time.Since(start).Milliseconds()
	if err != nil {
		return Result{Status: model.StatusDown, ResponseMS: elapsed, Message: trimErr(err)}
	}
	conn.Close()

	if elapsed >= int64(svc.DegradedMs) {
		return Result{Status: model.StatusDegraded, ResponseMS: elapsed, Message: fmt.Sprintf("slow connect %dms", elapsed)}
	}
	return Result{Status: model.StatusUp, ResponseMS: elapsed, Message: "connected"}
}

func statusAllowed(code int, allowed []int) bool {
	for _, a := range allowed {
		if a == code {
			return true
		}
	}
	return false
}

// trimErr shortens noisy network errors to something fit for a status card.
func trimErr(err error) string {
	msg := err.Error()
	if i := strings.LastIndex(msg, ": "); i >= 0 && len(msg)-i < 60 {
		msg = msg[i+2:]
	}
	if len(msg) > 80 {
		msg = msg[:77] + "..."
	}
	return msg
}

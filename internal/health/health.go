package health

import (
	"log"
	"net/http"
	"time"

	"github.com/nexus-homelab/nexus/internal/db"
)

func StartHealthChecker(interval time.Duration) {
	log.Printf("Starting health checker with interval %v", interval)
	ticker := time.NewTicker(interval)
	go func() {
		// Run once immediately
		checkAllServices()
		for range ticker.C {
			checkAllServices()
		}
	}()
}

func checkAllServices() {
	services, err := db.GetServices()
	if err != nil {
		log.Printf("Health Check: Failed to get services: %v", err)
		return
	}

	for _, s := range services {
		go checkService(s.ID, s.URL)
	}
}

func checkService(id string, url string) {
	client := http.Client{
		Timeout: 10 * time.Second,
	}

	status := "offline"
	start := time.Now()
	resp, err := client.Get(url)
	latency := time.Since(start).Milliseconds()

	if err == nil {
		if resp.StatusCode >= 200 && resp.StatusCode < 400 {
			status = "online"
		}
		resp.Body.Close()
	}

	err = db.UpdateServiceHealth(id, status, time.Now())
	if err != nil {
		log.Printf("Health Check: Failed to update status for %s: %v", url, err)
	}

	// Log to ClickHouse
	err = db.LogHealthCheck(id, url, status, latency)
	if err != nil {
		log.Printf("Health Check: Failed to log to ClickHouse for %s: %v", url, err)
	}
}

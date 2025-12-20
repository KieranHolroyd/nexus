package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/net/html"
)

const IconsDir = "data/icons"

func init() {
	if err := os.MkdirAll(IconsDir, 0755); err != nil {
		fmt.Printf("Warning: failed to create icons directory: %v\n", err)
	}
}

func RegisterIconHandlers(r http.Handler) {
	// These will be registered in services.go for convenience or specifically here
}

func searchIcons(w http.ResponseWriter, r *http.Request) {
	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		http.Error(w, "url parameter is required", http.StatusBadRequest)
		return
	}

	if !strings.HasPrefix(targetURL, "http") {
		targetURL = "http://" + targetURL
	}

	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		http.Error(w, "invalid url", http.StatusBadRequest)
		return
	}

	resp, err := http.Get(targetURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to fetch url: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf("failed to fetch url: status %d", resp.StatusCode), http.StatusInternalServerError)
		return
	}

	icons := make([]string, 0)
	
	// Add common favicon location
	icons = append(icons, fmt.Sprintf("%s://%s/favicon.ico", parsedURL.Scheme, parsedURL.Host))

	tokenizer := html.NewTokenizer(resp.Body)
	for {
		tokenType := tokenizer.Next()
		if tokenType == html.ErrorToken {
			break
		}
		if tokenType == html.StartTagToken || tokenType == html.SelfClosingTagToken {
			token := tokenizer.Token()
			if token.Data == "link" {
				var rel, href string
				for _, attr := range token.Attr {
					if attr.Key == "rel" {
						rel = strings.ToLower(attr.Val)
					}
					if attr.Key == "href" {
						href = attr.Val
					}
				}
				if strings.Contains(rel, "icon") || strings.Contains(rel, "apple-touch-icon") {
					icons = append(icons, resolveURL(targetURL, href))
				}
			}
			if token.Data == "meta" {
				var property, content string
				for _, attr := range token.Attr {
					if attr.Key == "property" || attr.Key == "name" {
						property = strings.ToLower(attr.Val)
					}
					if attr.Key == "content" {
						content = attr.Val
					}
				}
				if property == "og:image" || property == "twitter:image" {
					icons = append(icons, resolveURL(targetURL, content))
				}
			}
		}
	}

	// Deduplicate
	uniqueIcons := make([]string, 0)
	seen := make(map[string]bool)
	for _, icon := range icons {
		if !seen[icon] {
			uniqueIcons = append(uniqueIcons, icon)
			seen[icon] = true
		}
	}

	jsonResponse(w, http.StatusOK, uniqueIcons)
}

func downloadIcon(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		URL string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := http.Get(payload.URL)
	if err != nil {
		http.Error(w, "failed to download icon", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	ext := ".png" // default
	if contentType := resp.Header.Get("Content-Type"); contentType != "" {
		if strings.Contains(contentType, "svg") {
			ext = ".svg"
		} else if strings.Contains(contentType, "x-icon") || strings.Contains(contentType, "vnd.microsoft.icon") {
			ext = ".ico"
		} else if strings.Contains(contentType, "webp") {
			ext = ".webp"
		} else if strings.Contains(contentType, "jpeg") {
			ext = ".jpg"
		}
	}

	filename := uuid.New().String() + ext
	filepath := filepath.Join(IconsDir, filename)

	out, err := os.Create(filepath)
	if err != nil {
		http.Error(w, "failed to save icon", http.StatusInternalServerError)
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, resp.Body); err != nil {
		http.Error(w, "failed to save icon content", http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"path": "/icons/" + filename})
}

func uploadIcon(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10 << 20) // 10MB limit

	file, header, err := r.FormFile("icon")
	if err != nil {
		http.Error(w, "failed to get file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	path := filepath.Join(IconsDir, filename)

	out, err := os.Create(path)
	if err != nil {
		http.Error(w, "failed to save file", http.StatusInternalServerError)
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		http.Error(w, "failed to copy file content", http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"path": "/icons/" + filename})
}

func resolveURL(base, ref string) string {
	u, err := url.Parse(ref)
	if err != nil {
		return ref
	}
	baseURL, err := url.Parse(base)
	if err != nil {
		return ref
	}
	return baseURL.ResolveReference(u).String()
}

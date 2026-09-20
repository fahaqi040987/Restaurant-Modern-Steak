/**
 * Resolves a product/asset image URL to an absolute URL on the backend.
 *
 * The database stores relative paths like `/uploads/<uuid>.jpg`. Those paths
 * are served by the backend (port 8080), not the frontend origin — using them
 * verbatim makes the browser request them from the frontend dev server, which
 * responds with the SPA's index.html (HTTP 200, wrong content) and silently
 * breaks the <img>.
 */
const API_BASE_URL = (
  import.meta.env?.VITE_API_URL || "http://localhost:8080/api/v1"
).replace(/\/api\/v1\/?$/, "");

export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads") || url.startsWith("/images")) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

import { useEffect } from "react";

const SITE_URL = "https://ansenanimes.com.br";

interface SeoConfig {
  title: string;
  description: string;
  image?: string;
  canonical?: string; // caminho relativo (/anime/slug) ou URL absoluta
  type?: string;
  keywords?: string[];
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

function ensureMeta(attribute: "name" | "property", key: string, content?: string) {
  if (!content) {
    document.querySelector(`meta[${attribute}="${key}"]`)?.remove();
    return;
  }

  let meta = document.querySelector(`meta[${attribute}="${key}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

function ensureCanonicalLink(href: string) {
  let link = document.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}

function ensureStructuredData(data?: Record<string, unknown> | Record<string, unknown>[]) {
  const scriptId = "ansen-structured-data";
  const existingScript = document.getElementById(scriptId);

  if (!data) {
    existingScript?.remove();
    return;
  }

  const script = existingScript || document.createElement("script");
  script.id = scriptId;
  script.setAttribute("type", "application/ld+json");
  script.textContent = JSON.stringify(data);

  if (!existingScript) {
    document.head.appendChild(script);
  }
}

/**
 * Constrói a URL canônica absoluta com base no caminho relativo ou URL absoluta fornecida.
 * Sempre usa SITE_URL hardcoded para evitar que window.location.origin gere URLs erradas
 * antes do JS terminar de carregar (problema que causava 415 páginas com canônica duplicada).
 */
function buildCanonicalUrl(canonical?: string): string {
  if (!canonical) {
    // Fallback: URL atual sem trailing slash (evita /page/ e /page serem tratadas como duplicatas)
    return (typeof window !== "undefined" ? window.location.href : SITE_URL)
      .replace(/\/$/, "") || SITE_URL;
  }

  // Já é URL absoluta com o dominio correto
  if (canonical.startsWith(SITE_URL)) {
    return canonical.replace(/\/$/, "");
  }

  // Caminho relativo — monta a URL absoluta com o dominio hardcoded
  const path = canonical.startsWith("/") ? canonical : `/${canonical}`;
  return `${SITE_URL}${path}`.replace(/\/$/, "");
}

export function useSeo({
  title,
  description,
  image,
  canonical,
  type = "website",
  keywords,
  structuredData,
}: SeoConfig) {
  const serializedStructuredData = structuredData ? JSON.stringify(structuredData) : "";
  const serializedKeywords = keywords?.join(", ") || "";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const canonicalUrl = buildCanonicalUrl(canonical);

    document.title = title;
    ensureCanonicalLink(canonicalUrl);

    ensureMeta("name", "description", description);
    ensureMeta("name", "keywords", serializedKeywords);
    ensureMeta("property", "og:title", title);
    ensureMeta("property", "og:description", description);
    ensureMeta("property", "og:type", type);
    ensureMeta("property", "og:url", canonicalUrl);
    ensureMeta("property", "og:image", image);
    ensureMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    ensureMeta("name", "twitter:title", title);
    ensureMeta("name", "twitter:description", description);
    ensureMeta("name", "twitter:image", image);
    ensureStructuredData(serializedStructuredData ? JSON.parse(serializedStructuredData) : undefined);
  }, [canonical, description, image, serializedKeywords, serializedStructuredData, title, type]);
}

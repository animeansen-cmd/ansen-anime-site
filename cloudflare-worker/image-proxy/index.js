/**
 * Ansen Image Proxy Worker
 * Busca imagens do animeq.net adicionando o Referer correto,
 * burlando o hotlink protection deles.
 *
 * Uso: https://img.ansenanimes.com.br/?url=https://animeq.net/wp-content/...
 */

const ALLOWED_DOMAINS = ["animeq.net"];
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 dias

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (!targetUrl) {
      return new Response("Missing ?url= parameter", { status: 400 });
    }

    // Valida domínio para evitar uso indevido do proxy
    let parsedTarget;
    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      return new Response("Invalid URL", { status: 400 });
    }

    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) => parsedTarget.hostname === domain || parsedTarget.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return new Response("Domain not allowed", { status: 403 });
    }

    // Verifica cache do Cloudflare primeiro
    const cacheKey = new Request(targetUrl, { method: "GET" });
    const cache = caches.default;
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return addCorsHeaders(cachedResponse);
    }

    // Busca a imagem spoofiando o Referer
    let imageResponse;
    try {
      imageResponse = await fetch(targetUrl, {
        headers: {
          "Referer": `${parsedTarget.origin}/`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9",
        },
        cf: {
          cacheTtl: CACHE_TTL,
          cacheEverything: true,
        },
      });
    } catch (err) {
      return new Response("Failed to fetch image", { status: 502 });
    }

    if (!imageResponse.ok) {
      return new Response(`Upstream error: ${imageResponse.status}`, {
        status: imageResponse.status,
      });
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Rejeita se não for imagem (evita servir a página de "hotlink blocked")
    if (!contentType.startsWith("image/")) {
      return new Response("Not an image", { status: 422 });
    }

    const responseHeaders = new Headers({
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${CACHE_TTL}`,
      "Access-Control-Allow-Origin": "*",
      "X-Proxy": "ansen-img-proxy",
    });

    const response = new Response(imageResponse.body, {
      status: 200,
      headers: responseHeaders,
    });

    // Salva no cache do Cloudflare
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
};

function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}

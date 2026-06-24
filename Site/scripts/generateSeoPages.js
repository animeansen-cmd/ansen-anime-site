// Site/scripts/generateSeoPages.js
// Chamado automaticamente pelo script "build" do package.json para gerar arquivos HTML com as meta tags corretas.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_NAME = "Ansen Animes";
const SITE_URL  = "https://ansenanimes.com.br";
const DIST_DIR  = path.join(__dirname, "../dist");

const ANIME_DATA_PATHS = [
  path.join(__dirname, "../../data/animesFull.json"),
  path.join(DIST_DIR,  "data/animesFull.json"),
];

const MOVIE_DATA_PATHS = [
  path.join(__dirname, "../../data/filmesFull.json"),
  path.join(DIST_DIR,  "data/filmesFull.json"),
];

function loadData(paths) {
  for (const file of paths) {
    if (fs.existsSync(file)) {
      try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (err) {
        console.error(`Erro ao ler arquivo ${file}:`, err);
      }
    }
  }
  return [];
}

function loadAnimes() {
  const animes = loadData(ANIME_DATA_PATHS);
  const movies = loadData(MOVIE_DATA_PATHS).map(m => ({ ...m, type: "movie" }));
  return [...animes, ...movies];
}

// ── Funções de SEO (Portadas de src/lib/animeSeo.ts e src/services/api.ts) ──

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function truncate(text = "", max = 155) {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trim() + "...";
}

function getAltTitleList(altTitle = "", title = "") {
  const normalizedTitle = normalizeText(title);
  return [...new Set(
    altTitle
      .split(/\r?\n|[|;,/]+/)
      .map(part => part.trim())
      .filter(part => part.length >= 2)
      .filter(part => normalizeText(part) !== normalizedTitle)
  )];
}

function cleanEpisodeTitle(title = "") {
  return title.replace(/^Epis.dio\s*\d+\s*-?\s*/i, "").trim();
}

function buildAnimeSeoTitle(anime) {
  const altTitles = getAltTitleList(anime.altTitle || "", anime.title || "");
  const firstAlt  = altTitles[0];

  if (firstAlt) {
    return truncate(`${anime.title} (${firstAlt}) Online | ${SITE_NAME}`, 70);
  }

  return `${anime.title} Online | ${SITE_NAME}`;
}

function buildAnimeSeoDescription(anime) {
  const altTitles  = getAltTitleList(anime.altTitle || "", anime.title || "");
  const firstAlt   = altTitles[0] ? ` Também conhecido como ${altTitles[0]}.` : "";
  const lang       = anime.language === "dublado" ? "dublado" : "legendado";
  const synopsis   = (anime.synopsis || anime.description || "").trim();
  const year       = anime.year ? ` (${anime.year})` : "";
  const epCount    = anime.episodes?.length ? ` ${anime.episodes.length} episódios disponíveis.` : "";

  const base = synopsis
    ? `${synopsis}${firstAlt}`
    : `Assista ${anime.title}${year} ${lang} em HD.${firstAlt}${epCount}`;

  return truncate(base);
}

function buildAnimeSeoKeywords(anime) {
  const altTitles = getAltTitleList(anime.altTitle || "", anime.title || "");
  const lang      = anime.language === "dublado" ? "dublado" : "legendado";

  return [
    anime.title,
    ...altTitles,
    `assistir ${anime.title}`,
    `${anime.title} online`,
    `${anime.title} ${lang}`,
    `${anime.title} ${lang} completo`,
    `${anime.title} todos os episodios`,
    `${anime.title} hd`,
    ...(anime.genres || []).slice(0, 5).map(g => `anime de ${g.toLowerCase()}`),
    anime.year ? `animes ${anime.year}` : "",
    "assistir anime online gratis",
    "animes hd dublado legendado",
  ].filter(Boolean);
}

function buildEpisodeSeoTitle(anime, episode) {
  const ep = String(episode.number).padStart(2, "0");
  return `${anime.title} Episódio ${ep} Online | ${SITE_NAME}`;
}

function buildEpisodeSeoDescription(anime, episode) {
  const ep         = String(episode.number).padStart(2, "0");
  const cleanTitle = cleanEpisodeTitle(episode.title || "");
  const lang       = anime.language === "dublado" ? "dublado" : "legendado";
  const altTitles  = getAltTitleList(anime.altTitle || "", anime.title || "");
  const firstAlt   = altTitles[0] ? ` Título alternativo: ${altTitles[0]}.` : "";

  const base = `Assistir ${anime.title} Episódio ${ep}${cleanTitle ? ` - ${cleanTitle}` : ""} ${lang} em HD.${firstAlt}`;
  return truncate(base);
}

function buildEpisodeSeoKeywords(anime, episode) {
  const ep        = String(episode.number).padStart(2, "0");
  const altTitles = getAltTitleList(anime.altTitle || "", anime.title || "");
  const lang      = anime.language === "dublado" ? "dublado" : "legendado";
  const label     = `${anime.title} episodio ${ep}`;

  return [
    anime.title,
    ...altTitles,
    label,
    `${label} online`,
    `${label} ${lang}`,
    `${label} hd`,
    `assistir ${anime.title} online`,
    cleanEpisodeTitle(episode.title || ""),
    "assistir anime online gratis",
  ].filter(Boolean);
}

function animeCanonicalUrl(slug) {
  return `${SITE_URL}/anime/${slug}`;
}

function episodeCanonicalUrl(slug, number) {
  return `${SITE_URL}/episodio/${slug}/${number}`;
}

function getLanguageLabel(anime) {
  if ((anime.genres || []).includes("Dublado") || (anime.title || "").toLowerCase().includes("dublado")) {
    return "Dublado";
  }
  return "Legendado";
}

function getBannerImage(anime) {
  return (anime.banners || [])[0] || anime.banner || anime.cover || "";
}

function toRating(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const normalized = String(value ?? "")
    .replace(",", ".")
    .match(/\d+(\.\d+)?/)?.[0];
  const parsed = Number(normalized ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAnimeRating(anime) {
  return toRating(anime.rating);
}

function absoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return `${SITE_URL}/${url}`;
}

// ── Renderização do HTML de template ──

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttr(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderHtml(templateHtml, seo) {
  let html = templateHtml;

  // 1. Substituir o título
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);

  // 2. Remover qualquer script de LD+JSON padrão da head
  html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");

  // 3. Montar tags novas
  const metaTags = [];

  if (seo.description) {
    metaTags.push(`<meta name="description" content="${escapeHtmlAttr(seo.description)}" />`);
  }
  if (seo.keywords) {
    const kwStr = Array.isArray(seo.keywords) ? seo.keywords.join(", ") : seo.keywords;
    metaTags.push(`<meta name="keywords" content="${escapeHtmlAttr(kwStr)}" />`);
  }
  if (seo.canonical) {
    metaTags.push(`<link rel="canonical" href="${escapeHtmlAttr(seo.canonical)}" />`);
  }

  // Open Graph
  metaTags.push(`<meta property="og:title" content="${escapeHtmlAttr(seo.title)}" />`);
  if (seo.description) {
    metaTags.push(`<meta property="og:description" content="${escapeHtmlAttr(seo.description)}" />`);
  }
  if (seo.canonical) {
    metaTags.push(`<meta property="og:url" content="${escapeHtmlAttr(seo.canonical)}" />`);
  }
  if (seo.image) {
    metaTags.push(`<meta property="og:image" content="${escapeHtmlAttr(absoluteUrl(seo.image))}" />`);
  }

  // Twitter Card
  if (seo.image) {
    metaTags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  } else {
    metaTags.push(`<meta name="twitter:card" content="summary" />`);
  }
  metaTags.push(`<meta name="twitter:title" content="${escapeHtmlAttr(seo.title)}" />`);
  if (seo.description) {
    metaTags.push(`<meta name="twitter:description" content="${escapeHtmlAttr(seo.description)}" />`);
  }
  if (seo.image) {
    metaTags.push(`<meta name="twitter:image" content="${escapeHtmlAttr(absoluteUrl(seo.image))}" />`);
  }

  // Structured Data
  if (seo.structuredData) {
    metaTags.push(`<script id="ansen-structured-data" type="application/ld+json">${JSON.stringify(seo.structuredData)}</script>`);
  }

  // Limpar as antigas tags equivalentes para evitar duplicados
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/gi, "");
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, "");

  // Inserir as novas tags antes do </head>
  const headEndIndex = html.indexOf("</head>");
  if (headEndIndex !== -1) {
    html = html.slice(0, headEndIndex) + "\n    " + metaTags.join("\n    ") + "\n" + html.slice(headEndIndex);
  }

  return html;
}

// Concorrência controlada para escrita de arquivos
async function runConcurrently(tasks, limit = 100) {
  let activeCount = 0;
  let taskIndex = 0;
  
  return new Promise((resolve, reject) => {
    function next() {
      if (taskIndex >= tasks.length && activeCount === 0) {
        resolve();
        return;
      }
      
      while (activeCount < limit && taskIndex < tasks.length) {
        const currentTask = tasks[taskIndex++];
        activeCount++;
        currentTask()
          .then(() => {
            activeCount--;
            next();
          })
          .catch((err) => {
            activeCount--;
            console.error("Erro na tarefa de escrita:", err);
            next();
          });
      }
    }
    next();
  });
}

// ── Função Principal de geração das páginas ──

async function main() {
  const indexHtmlPath = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(indexHtmlPath)) {
    console.error("❌ ERRO: Site/dist/index.html não encontrado. Rode npm run build primeiro!");
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(indexHtmlPath, "utf8");
  const animes = loadAnimes();

  console.log(`🚀 Iniciando geração de páginas SEO para ${animes.length} títulos...`);
  
  const tasks = [];

  // 1. PÁGINAS ESTÁTICAS

  // Home Page (sobrescreve o index.html principal do dist/)
  tasks.push(async () => {
    const seo = {
      title: "Ansen Animes — Assista animes online grátis",
      description: "Assista animes online grátis no Ansen Animes. Episódios legendados e dublados, filmes e lançamentos em dia.",
      canonical: `${SITE_URL}/`,
      keywords: ["animes online", "assistir anime", "animes gratis", "anime dublado", "anime legendado", "ansen animes"],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Ansen Animes",
        "url": `${SITE_URL}/`,
        "description": "Catalogo completo de animes para assistir online dublado e legendado em HD.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${SITE_URL}/animes?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }
    };
    const html = renderHtml(templateHtml, seo);
    fs.writeFileSync(indexHtmlPath, html, "utf8");
  });

  const staticPages = [
    {
      route: "animes",
      title: "Catalogo de Animes | Ansen Animes",
      description: "Explore o catalogo completo de animes e filmes no Ansen Animes. Filtre por genero, ano, idioma e muito mais.",
      keywords: ["catalogo de animes", "filmes de anime", "genero de anime", "ano de lancamento", "ansen animes"]
    },
    {
      route: "episodios",
      title: "Ultimos Episodios | Ansen Animes",
      description: "Assista os episodios mais recentes de todos os animes no Ansen Animes. Atualizacao diaria.",
      keywords: ["ultimos episodios", "episodios novos", "animes lancados", "assistir animes", "ansen animes"]
    },
    {
      route: "novosanimes",
      title: "Novos Animes | Ansen Animes",
      description: "Descubra os animes mais recentes adicionados ao catalogo do Ansen Animes. Atualizacao constante.",
      keywords: ["novos animes", "animes recem adicionados", "lancar animes", "ansen animes"]
    },
    {
      route: "calendario",
      title: "Calendario Semanal | Ansen Animes",
      description: "Veja quais animes estao sendo lancados em cada dia da semana no Ansen Animes.",
      keywords: ["calendario de animes", "dia de lancamento", "animes semanais", "ansen animes"]
    }
  ];

  for (const page of staticPages) {
    tasks.push(async () => {
      const seo = {
        title: page.title,
        description: page.description,
        canonical: `${SITE_URL}/${page.route}`,
        keywords: page.keywords
      };
      const html = renderHtml(templateHtml, seo);
      const targetDir = path.join(DIST_DIR, page.route);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, "index.html"), html, "utf8");
    });
  }

  // 2. DETALHES DE ANIME E FILMES
  for (const anime of animes) {
    if (!anime.slug) continue;

    tasks.push(async () => {
      let displaySynopsis = anime.synopsis || anime.description || "";
      let displayYear = anime.year;
      if (displaySynopsis) {
        const yearMatch = displaySynopsis.match(/Ano de Lan[çc]amento:\s*(\d+)/i);
        if (yearMatch && (!displayYear || displayYear === "Ano indefinido")) displayYear = yearMatch[1];
        const sinopseMatch = displaySynopsis.match(/Sinopse:\s*(.*?)(?=Ano de Lan[çc]amento:|\n\s*ler\s|$)/is);
        if (sinopseMatch) displaySynopsis = sinopseMatch[1].trim();
        else {
          displaySynopsis = displaySynopsis.replace(/T[íi]tulo Alternativo:.*?(\n|$)/i, "").trim();
          displaySynopsis = displaySynopsis.replace(/Ano de Lan[çc]amento:.*?(\n|$)/i, "").trim();
        }
        displaySynopsis = displaySynopsis.split(/\n\s*ler\s/i)[0].trim();
      }

      const title = buildAnimeSeoTitle(anime);
      const description = displaySynopsis.substring(0, 160) || buildAnimeSeoDescription(anime);
      const canonical = animeCanonicalUrl(anime.slug);
      const image = getBannerImage(anime);
      const keywords = buildAnimeSeoKeywords(anime);

      const altTitles = getAltTitleList(anime.altTitle || "", anime.title || "");
      const isSeries = anime.episodes && anime.episodes.length > 1;

      const structuredData = {
        "@context": "https://schema.org",
        "@type": isSeries ? "TVSeries" : "Movie",
        "name": anime.title,
        "alternateName": altTitles,
        "description": displaySynopsis,
        "image": [anime.cover, ...(anime.banners || [])].filter(Boolean).map(absoluteUrl),
        "inLanguage": getLanguageLabel(anime) === "Dublado" ? "pt-BR" : "ja-JP",
        "datePublished": displayYear || undefined,
      };

      const rating = getAnimeRating(anime);
      if (rating > 0) {
        structuredData.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": rating.toFixed(1),
          "bestRating": "10",
          "worstRating": "0",
          "ratingCount": Math.max(anime.episodes ? anime.episodes.length : 0, 1)
        };
      }

      const seo = {
        title,
        description,
        canonical,
        image,
        keywords,
        structuredData
      };

      const html = renderHtml(templateHtml, seo);
      const targetDir = path.join(DIST_DIR, "anime", anime.slug);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, "index.html"), html, "utf8");
    });

    // 3. EPISÓDIOS DO ANIME
    const episodes = anime.episodes || [];
    for (const episode of episodes) {
      if (!episode.number) continue;

      tasks.push(async () => {
        const cleanTitle = cleanEpisodeTitle(episode.title || "");
        const altTitles = getAltTitleList(anime.altTitle || "", anime.title || "");
        
        const title = buildEpisodeSeoTitle(anime, episode);
        const description = buildEpisodeSeoDescription(anime, episode);
        const canonical = episodeCanonicalUrl(anime.slug, episode.number);
        const image = episode.thumbnail || anime.cover;
        const keywords = buildEpisodeSeoKeywords(anime, episode);

        const structuredData = {
          "@context": "https://schema.org",
          "@type": "TVEpisode",
          "name": `${anime.title} Episodio ${String(episode.number).padStart(2, "0")}`,
          "alternativeHeadline": cleanTitle || undefined,
          "description": anime.synopsis || anime.description || "",
          "url": `/episodio/${anime.slug}/${episode.number}`,
          "image": [episode.thumbnail, anime.cover].filter(Boolean).map(absoluteUrl),
          "partOfSeries": {
            "@type": "TVSeries",
            "name": anime.title,
            "alternateName": altTitles,
          },
          "episodeNumber": episode.number
        };

        const seo = {
          title,
          description,
          canonical,
          image,
          keywords,
          structuredData
        };

        const html = renderHtml(templateHtml, seo);
        const targetDir = path.join(DIST_DIR, "episodio", anime.slug, String(episode.number));
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, "index.html"), html, "utf8");
      });
    }
  }

  console.log(`📦 Criando total de ${tasks.length} arquivos HTML estáticos pré-renderizados...`);
  
  const startTime = Date.now();
  let doneCount = 0;
  
  // Embrulhar as tarefas para reportar progresso
  const wrappedTasks = tasks.map(task => async () => {
    await task();
    doneCount++;
    if (doneCount % 1000 === 0 || doneCount === tasks.length) {
      console.log(`✅ [progresso] ${doneCount}/${tasks.length} arquivos gerados...`);
    }
  });

  await runConcurrently(wrappedTasks, 150);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`🎉 Sucesso! Todas as ${tasks.length} páginas SEO foram pré-renderizadas em ${duration}s!`);
}

main().catch(err => {
  console.error("❌ Ocorreu um erro no processo de geração SEO:", err);
  process.exit(1);
});

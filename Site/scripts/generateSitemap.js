// Site/scripts/generateSitemap.js
// Roda depois do vite build → gera sitemap.xml + robots.txt em Site/dist/
// Chamado automaticamente pelo script "build" do package.json

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_URL       = "https://ansenanimes.com.br";
const DIST_DIR       = path.join(__dirname, "../dist");
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
            try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
        }
    }
    return [];
}

function loadAnimes() {
    const animes = loadData(ANIME_DATA_PATHS);
    const movies = loadData(MOVIE_DATA_PATHS);
    
    const combined = [...animes, ...movies];
    if (!combined.length) {
        console.warn("⚠️ Dados nao encontrados, sitemap sera gerado vazio");
    }
    return combined;
}

function generateSitemap() {
    if (!fs.existsSync(DIST_DIR)) {
        console.error("dist/ nao encontrado. Rode npm run build primeiro.");
        process.exit(1);
    }

    const animes = loadAnimes();
    const today  = new Date().toISOString().split("T")[0];
    const urls   = [];

    // home e paginas estaticas
    urls.push({ loc: `${SITE_URL}/`,            priority: "1.0", changefreq: "daily" });
    urls.push({ loc: `${SITE_URL}/animes`,       priority: "0.7", changefreq: "daily" });
    urls.push({ loc: `${SITE_URL}/episodios`,    priority: "0.8", changefreq: "daily" });
    urls.push({ loc: `${SITE_URL}/novosanimes`,  priority: "0.7", changefreq: "daily" });
    urls.push({ loc: `${SITE_URL}/calendario`,   priority: "0.5", changefreq: "weekly" });

    // animes
    for (const anime of animes) {
        if (!anime.slug || !anime.title) continue;

        urls.push({
            loc:        `${SITE_URL}/anime/${anime.slug}`,
            priority:   "0.8",
            changefreq: "weekly"
        });

        // episodios com video
        for (const ep of (anime.episodes || [])) {
            if (!ep.number || !ep.video) continue;
            urls.push({
                loc:        `${SITE_URL}/episodio/${anime.slug}/${ep.number}`,
                priority:   "0.6",
                changefreq: "monthly"
            });
        }
    }

    // XML
    const xml = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
        ...urls.map(u =>
            `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
        ),
        `</urlset>`
    ].join("\n");

    fs.writeFileSync(path.join(DIST_DIR, "sitemap.xml"), xml, "utf8");
    console.log(`sitemap.xml: ${urls.length} URLs`);

    // robots.txt
    fs.writeFileSync(path.join(DIST_DIR, "robots.txt"), [
        `User-agent: *`,
        `Allow: /`,
        `Disallow: /admin`,
        ``,
        `Sitemap: ${SITE_URL}/sitemap.xml`
    ].join("\n"), "utf8");
    console.log(`robots.txt gerado`);
}

generateSitemap();

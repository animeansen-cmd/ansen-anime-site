// Site/src/lib/animeSeo.ts

import type { Anime, AnimeEpisode } from "@/types/anime";

const SITE_NAME = "Ansen Animes";
const SITE_URL  = "https://ansenanimes.com.br";

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

export function getAltTitleList(altTitle = "", title = "") {
    const normalizedTitle = normalizeText(title);
    return [...new Set(
        altTitle
            .split(/\r?\n|[|;,/]+/)
            .map(part => part.trim())
            .filter(part => part.length >= 2)
            .filter(part => normalizeText(part) !== normalizedTitle)
    )];
}

export function cleanEpisodeTitle(title = "") {
    return title.replace(/^Epis.dio\s*\d+\s*-?\s*/i, "").trim();
}

// ── Anime ────────────────────────────────────────────────

export function buildAnimeSeoTitle(anime: Anime) {
    const altTitles = getAltTitleList(anime.altTitle, anime.title);
    const firstAlt  = altTitles[0];

    // "Sousou no Frieren (Frieren: Beyond Journey's End) Online | Ansen Animes"
    // captura buscas em japonês E inglês ao mesmo tempo
    if (firstAlt) {
        return truncate(`${anime.title} (${firstAlt}) Online | ${SITE_NAME}`, 70);
    }

    return `${anime.title} Online | ${SITE_NAME}`;
}

export function buildAnimeSeoDescription(anime: Anime) {
    const altTitles  = getAltTitleList(anime.altTitle, anime.title);
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

export function buildAnimeSeoKeywords(anime: Anime): string[] {
    const altTitles = getAltTitleList(anime.altTitle, anime.title);
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
        ...anime.genres.slice(0, 5).map(g => `anime de ${g.toLowerCase()}`),
        anime.year ? `animes ${anime.year}` : "",
        "assistir anime online gratis",
        "animes hd dublado legendado",
    ].filter(Boolean) as string[];
}

// ── Episódio ─────────────────────────────────────────────

export function buildEpisodeSeoTitle(anime: Anime, episode: AnimeEpisode) {
    const ep = String(episode.number).padStart(2, "0");
    return `${anime.title} Episódio ${ep} Online | ${SITE_NAME}`;
}

export function buildEpisodeSeoDescription(anime: Anime, episode: AnimeEpisode) {
    const ep         = String(episode.number).padStart(2, "0");
    const cleanTitle = cleanEpisodeTitle(episode.title);
    const lang       = anime.language === "dublado" ? "dublado" : "legendado";
    const altTitles  = getAltTitleList(anime.altTitle, anime.title);
    const firstAlt   = altTitles[0] ? ` Título alternativo: ${altTitles[0]}.` : "";

    const base = `Assistir ${anime.title} Episódio ${ep}${cleanTitle ? ` - ${cleanTitle}` : ""} ${lang} em HD.${firstAlt}`;
    return truncate(base);
}

export function buildEpisodeSeoKeywords(anime: Anime, episode: AnimeEpisode): string[] {
    const ep        = String(episode.number).padStart(2, "0");
    const altTitles = getAltTitleList(anime.altTitle, anime.title);
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
        cleanEpisodeTitle(episode.title),
        "assistir anime online gratis",
    ].filter(Boolean) as string[];
}

// ── Canonical URL helpers ─────────────────────────────────

export function animeCanonicalUrl(slug: string) {
    return `${SITE_URL}/anime/${slug}`;
}

export function episodeCanonicalUrl(slug: string, number: number) {
    return `${SITE_URL}/episodio/${slug}/${number}`;
}

import { queryOptions } from "@tanstack/react-query";
import type { Anime, CatalogEpisode, VideoData } from "@/types/anime";
import { supabase } from "@/lib/supabase";
import type { SiteSettings, EpisodeComment } from "@/lib/supabase";

export interface LatestEpisode {
  animeSlug: string;
  title: string;
  number: number;
  image: string;
  video: string | VideoData | null;
  createdAt: string;
  order?: number;
}

const DATA_URL = "/data/animesFull.json";
const MOVIES_URL = "/data/filmesFull.json";
const LATEST_URL = "/data/latestEpisodes.json";

let animesRequest: Promise<Anime[]> | null = null;
let latestRequest: Promise<LatestEpisode[]> | null = null;

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function toTimestamp(value?: string) {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/\./g, "").trim();
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function toRating(value: string | number | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? "")
    .replace(",", ".")
    .match(/\d+(\.\d+)?/)?.[0];

  const parsed = Number(normalized ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

// URL do Cloudflare Worker que faz proxy das imagens do animeq.net
// adicionando o Referer correto para burlar o hotlink protection.
const IMAGE_PROXY_URL = "https://img.ansenanimes.com.br";

function cleanUrl(url: string | undefined): string {
  if (!url || url.startsWith("data:image") || url.includes("placeholder")) return "";
  return url;
}

function getHighResUrl(url: string | undefined): string {
  const cleaned = cleanUrl(url);
  if (!cleaned) return "";
  if (cleaned.startsWith(IMAGE_PROXY_URL)) {
    return cleaned;
  }

  // TMDB: troca tamanho fixo pela versão original
  if (cleaned.includes("image.tmdb.org")) {
    return cleaned.replace(/\/w\d+\//, "/original/");
  }

  // animeq: remove o sufixo de dimensão do WordPress (-300x450, -225x318, etc)
  // antes de passar pro proxy, para pedir a imagem em resolução original.
  if (cleaned.includes("animeq.net") || cleaned.includes("animeq")) {
    const originalUrl = cleaned.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, "$1");
    return `${IMAGE_PROXY_URL}/?url=${encodeURIComponent(originalUrl)}`;
  }

  // Demais URLs: tenta remover sufixo de dimensão também
  return cleaned.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, "$1");
}

// Fallback: mantém a URL com o sufixo de dimensão original (comportamento antigo).
// Usado como plano B caso a versão sem sufixo não exista no servidor.
function getProxiedUrl(url: string | undefined): string {
  const cleaned = cleanUrl(url);
  if (!cleaned) return "";
  if (cleaned.startsWith(IMAGE_PROXY_URL)) {
    return cleaned;
  }
  if (cleaned.includes("animeq.net") || cleaned.includes("animeq")) {
    return `${IMAGE_PROXY_URL}/?url=${encodeURIComponent(cleaned)}`;
  }
  return cleaned;
}

function getFallbackReleaseDate(anime: Anime) {
  if (anime.releaseDate && toTimestamp(anime.releaseDate)) {
    return anime.releaseDate;
  }

  if (anime.createdAt && toTimestamp(anime.createdAt)) {
    return anime.createdAt;
  }

  const episodeDates = [...(anime.episodes ?? [])]
    .map((episode) => episode.createdAt)
    .filter(Boolean) as string[];

  if (episodeDates.length > 0) {
    return episodeDates.sort((left, right) => toTimestamp(right) - toTimestamp(left))[0];
  }

  return anime.year ? `${anime.year}-01-01T00:00:00.000Z` : "";
}

function normalizeAnime(anime: Anime): Anime {
  const synopsis = anime.synopsis || anime.description || "";
  const cleanedCover = cleanUrl(anime.cover);

  return {
    ...anime,
    url: anime.url || "",
    altTitle: anime.altTitle || "",
    image: getHighResUrl(cleanUrl(anime.image) || cleanedCover),
    cover: getHighResUrl(cleanedCover),
    coverFallback: getProxiedUrl(cleanedCover), // URL com sufixo original, plano B
    banner: getHighResUrl(cleanUrl(anime.banner) || cleanUrl(anime.banners?.[0]) || cleanedCover),
    banners: (anime.banners?.length ? anime.banners : anime.banner ? [anime.banner] : []).map(getHighResUrl),
    description: synopsis,
    synopsis,
    aliases: [...new Set([anime.slug, ...(anime.aliases ?? [])].filter(Boolean))],
    createdAt: anime.createdAt || "",
    releaseDate: getFallbackReleaseDate(anime),
    rating: toRating(anime.rating),
    type: anime.type,
    video: anime.video,
    episodes: [...(anime.episodes ?? [])]
      .map((episode) => ({
        ...episode,
        url: episode.url || "",
        // Para thumbnails de episódio usamos getProxiedUrl (mantém o sufixo -300x170)
        // em vez de getHighResUrl (que remove o sufixo e pode causar 404 no WordPress)
        thumbnail: getProxiedUrl(cleanUrl(episode.thumbnail) || cleanedCover),
      }))
      .sort((left, right) => left.number - right.number),
  };
}

function matchesAnimeSlug(anime: Anime, slug: string) {
  return anime.slug === slug || anime.aliases?.includes(slug);
}

function findAnimeBySlug(animes: Anime[], slug: string) {
  return animes.find((anime) => matchesAnimeSlug(anime, slug));
}

async function fetchAnimes() {
  if (!animesRequest) {
    animesRequest = Promise.allSettled([
      fetch(DATA_URL).then((res) => (res.ok ? res.json() : [])),
      fetch(MOVIES_URL).then((res) => (res.ok ? res.json() : [])),
    ]).then(([animesRes, moviesRes]) => {
      const animesPayload = animesRes.status === "fulfilled" ? (animesRes.value as Anime[]) : [];
      const moviesPayload = moviesRes.status === "fulfilled" ? (moviesRes.value as Anime[]).map(m => ({ ...m, type: "movie" as const })) : [];
      
      const payload = [...animesPayload, ...moviesPayload];
      
      if (payload.length === 0) {
        throw new Error("Nao foi possivel carregar o catalogo.");
      }

      return payload.map(normalizeAnime);
    });
  }

  return animesRequest;
}

export const animesQueryOptions = queryOptions({
  queryKey: ["animes"],
  queryFn: fetchAnimes,
  staleTime: Number.POSITIVE_INFINITY,
});

async function fetchLatestEpisodes(): Promise<LatestEpisode[]> {
  if (!latestRequest) {
    latestRequest = fetch(LATEST_URL)
      .then(async (response) => {
        if (!response.ok) return [];
        const data = (await response.json()) as LatestEpisode[];
        return data.map((episode) => ({
          ...episode,
          // getProxiedUrl mantém o sufixo -300x170 (evita 404 no WordPress)
          image: getProxiedUrl(episode.image),
        }));
      })
      .catch(() => []);
  }

  return latestRequest;
}

export const latestEpisodesQueryOptions = queryOptions({
  queryKey: ["latestEpisodes"],
  queryFn: fetchLatestEpisodes,
  staleTime: 5 * 60 * 1000,
});

export function animeQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ["animes", slug],
    queryFn: async () => {
      const animes = await fetchAnimes();
      const anime = findAnimeBySlug(animes, slug);

      if (!anime) {
        throw new Error("Anime nao encontrado.");
      }

      return anime;
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function getDisplayGenres(anime: Anime) {
  return anime.genres.map(g => {
    const normalized = normalizeText(g);
    if (normalized === "animazione" || normalized === "animacao" || normalized === "desenhos" || normalized === "desenho") return "Animação";
    if (normalized === "acao e aventura" || normalized === "acao & aventura" || normalized === "acao") return "Ação";
    if (normalized === "dramma") return "Drama";
    if (normalized === "sci-fi" || normalized === "ficcao cientifica" || normalized === "sci-fi & fantasy" || normalized === "sci-fi & fantasia") return "Ficção Científica";
    if (normalized === "comedia" || normalized === "comedy") return "Comédia";
    if (normalized === "familia" || normalized === "kids") return "Família";
    if (normalized === "fantasia" || normalized === "fantasy") return "Fantasia";
    if (normalized === "misterio" || normalized === "mystery") return "Mistério";
    if (normalized === "esportes" || normalized === "esporte") return "Esportes";
    if (normalized === "aventura" || normalized === "adventure") return "Aventura";
    if (normalized === "war & politics" || normalized === "guerra") return "Guerra";
    if (normalized === "thriller" || normalized === "suspense") return "Suspense";
    if (normalized === "terror" || normalized === "horror") return "Terror";
    // First letter uppercase
    return g.charAt(0).toUpperCase() + g.slice(1);
  }).filter((genre, index, self) => {
    const normalized = normalizeText(genre);

    return (
      self.findIndex(g => normalizeText(g) === normalized) === index &&
      !/^letra\s/i.test(genre) &&
      normalized !== "legendado" &&
      normalized !== "dublado" &&
      normalized !== "filme" &&
      normalized !== "anime" &&
      normalized !== "tv" &&
      normalized !== "movie"
    );
  });
}

export function getLanguageLabel(anime: Anime) {
  if (anime.genres.includes("Dublado") || anime.title.toLowerCase().includes("dublado")) {
    return "Dublado";
  }

  return "Legendado";
}

export function isMovie(anime: Anime) {
  if (anime.type === "movie") return true;
  const text = `${anime.title} ${anime.slug} ${anime.altTitle || ""}`.toLowerCase();
  return text.includes("movie") || text.includes("filme") || text.includes("gekijou");
}

export function getAnimeRating(anime: Anime) {
  return toRating(anime.rating);
}

export function matchesAnimeSearch(anime: Anime, query: string) {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < 2) {
    return false;
  }

  const haystack = [
    anime.title,
    anime.altTitle,
    anime.slug,
    ...(anime.aliases ?? []),
    anime.year,
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeText(haystack).includes(normalizedQuery);
}

export function filterAnimesByCategory(animes: Anime[], category: string) {
  switch (category) {
    case "legendados":
      return animes.filter((anime) => getLanguageLabel(anime) === "Legendado");
    case "dublados":
      return animes.filter((anime) => getLanguageLabel(anime) === "Dublado");
    case "filmes":
      return animes.filter(isMovie);
    default:
      return animes;
  }
}

export function getBannerImage(anime: Anime) {
  return anime.banners[0] || anime.banner || anime.cover;
}

function uniqueStrings(values: Array<string | undefined>) {
  return [...new Set(values.filter(Boolean))] as string[];
}

function getAnimeCatalogKey(anime: Anime) {
  return `${normalizeText(anime.title)}::${getLanguageLabel(anime)}`;
}

function getEpisodeQualityScore(episode: Anime["episodes"][number]) {
  return (
    (episode.video ? 100 : 0) +
    (episode.thumbnail ? 20 : 0) +
    (episode.url ? 10 : 0) +
    (episode.createdAt ? 5 : 0) +
    (episode.title?.length || 0)
  );
}

function mergeEpisodes(
  leftEpisodes: Anime["episodes"] = [],
  rightEpisodes: Anime["episodes"] = [],
) {
  const byNumber = new Map<number, Anime["episodes"][number]>();

  for (const episode of [...leftEpisodes, ...rightEpisodes]) {
    const current = byNumber.get(episode.number);

    if (!current) {
      byNumber.set(episode.number, episode);
      continue;
    }

    const preferred = getEpisodeQualityScore(episode) >= getEpisodeQualityScore(current) ? episode : current;
    const fallback = preferred === episode ? current : episode;

    byNumber.set(episode.number, {
      ...fallback,
      ...preferred,
      title: preferred.title || fallback.title,
      url: preferred.url || fallback.url,
      thumbnail: preferred.thumbnail || fallback.thumbnail,
      video: preferred.video || fallback.video,
      createdAt: preferred.createdAt || fallback.createdAt,
    });
  }

  return [...byNumber.values()].sort((left, right) => left.number - right.number);
}

function getAnimeQualityScore(anime: Anime) {
  const synopsisLength = (anime.synopsis || anime.description || "").length;

  return (
    anime.episodes.length * 1000 +
    Math.min(synopsisLength, 500) +
    (anime.year ? 50 : 0) +
    (anime.banner || anime.banners.length ? 40 : 0) +
    (anime.cover ? 20 : 0) +
    (anime.altTitle ? 10 : 0) +
    getAnimeRating(anime) * 5
  );
}

function mergeAnimeGroup(group: Anime[]) {
  if (group.length === 1) {
    return group[0];
  }

  const preferred = group.reduce((best, current) =>
    getAnimeQualityScore(current) > getAnimeQualityScore(best) ? current : best,
  );

  return group.reduce<Anime>((merged, current) => {
    const mergedSynopsis = (merged.synopsis || merged.description || "");
    const currentSynopsis = (current.synopsis || current.description || "");
    const mergedRating = getAnimeRating(merged);
    const currentRating = getAnimeRating(current);

    return {
      ...merged,
      title: merged.title || current.title,
      altTitle: merged.altTitle || current.altTitle,
      image: merged.image || current.image,
      cover: merged.cover || current.cover,
      banner: merged.banner || current.banner,
      banners: uniqueStrings([...(merged.banners || []), ...(current.banners || []), merged.banner, current.banner]),
      description: mergedSynopsis.length >= currentSynopsis.length ? mergedSynopsis : currentSynopsis,
      synopsis: mergedSynopsis.length >= currentSynopsis.length ? mergedSynopsis : currentSynopsis,
      aliases: uniqueStrings([...(merged.aliases || []), ...(current.aliases || []), merged.slug, current.slug]),
      genres: uniqueStrings([...(merged.genres || []), ...(current.genres || [])]),
      year: merged.year || current.year,
      createdAt: merged.createdAt || current.createdAt,
      releaseDate: merged.releaseDate || current.releaseDate,
      rating: mergedRating >= currentRating ? merged.rating : current.rating,
      episodes: mergeEpisodes(merged.episodes, current.episodes),
    };
  }, {
    ...preferred,
    aliases: uniqueStrings([...(preferred.aliases || []), preferred.slug]),
    banners: uniqueStrings([...(preferred.banners || []), preferred.banner]),
    genres: uniqueStrings(preferred.genres || []),
    description: preferred.description || preferred.synopsis || "",
    synopsis: preferred.synopsis || preferred.description || "",
    episodes: [...preferred.episodes],
  });
}

export function getCatalogAnimes(animes: Anime[]) {
  const groups = new Map<string, Anime[]>();

  for (const anime of animes) {
    const key = getAnimeCatalogKey(anime);
    const current = groups.get(key) || [];
    current.push(anime);
    groups.set(key, current);
  }

  return [...groups.values()].map(mergeAnimeGroup);
}

function cleanAnimeName(title: string) {
  return title
    .replace(/\s*Dublado\s*/gi, " ")
    .replace(/\s*Legendado\s*/gi, " ")
    .replace(/\s*\d+(st|nd|rd|th)\s*Season/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function deduplicateAnimes(sorted: Anime[], limit: number): Anime[] {
  const result: Anime[] = [];
  const seen = new Set<string>();

  for (const anime of sorted) {
    if (result.length >= limit) break;
    const clean = cleanAnimeName(anime.title);
    if (seen.has(clean)) continue;
    seen.add(clean);
    result.push(anime);
  }

  return result;
}

export function getFeaturedAnimes(animes: Anime[], limit = 5) {
  const top2026Keywords = [
    "jujutsu kaisen: shimetsu kaiyuu – zenpen dublado",
    "tongari boushi no atelier",
    "one piece",
    "sousou no friere 2 dublado",
    "jigokuraku 2 dublado",
    "yuusha-kei ni shosu: choubatsu yuusha 9004-tai keimu kiroku dublado",
    "seihantai na kimi to boku dublado",
    "my hero academia: vigilantes",
    "yomi no tsugai",
    "mao",
    "nippon sangoku",
    "ganbare! nakamura-kun!! dublado",
  ];

  const featured: Anime[] = [];
  const addedIds = new Set<string>();

  // 1. Prioriza os animes recomendados (top 2026)
  for (const keyword of top2026Keywords) {
    const matches = animes.filter((a) => a.title.toLowerCase().includes(keyword));
    if (matches.length > 0) {
      // Pega o legendado se tiver, senao pega o primeiro
      const bestMatch = matches.find((a) => !a.title.toLowerCase().includes("dublado")) || matches[0];
      
      // Usa getAnimeCatalogKey para nao repetir filmes/animes com nomes muito parecidos
      const key = getAnimeCatalogKey(bestMatch);
      if (!addedIds.has(key)) {
        featured.push(bestMatch);
        addedIds.add(key);
      }
    }
  }

  // 2. Preenche o restante com os lancamentos mais novos
  if (featured.length < limit) {
    const newAnimes = getNewAnimes(animes, limit + featured.length);
    for (const na of newAnimes) {
      const key = getAnimeCatalogKey(na);
      if (!addedIds.has(key)) {
        featured.push(na);
        addedIds.add(key);
        if (featured.length >= limit) break;
      }
    }
  }

  return featured.slice(0, limit);
}

export function getPopularAnimes(animes: Anime[], limit = 5) {
  return [...animes]
    .sort((left, right) => getAnimeRating(right) - getAnimeRating(left) || right.episodes.length - left.episodes.length)
    .slice(0, limit);
}

export function getNewAnimes(animes: Anime[], limit = 15) {
  const sorted = [...animes].sort((left, right) => {
    // 1. Prioridade máxima: Ano de lançamento (para evitar que animes antigos de 1990 scraped hoje passem na frente)
    const leftYear = parseInt(left.year) || 0;
    const rightYear = parseInt(right.year) || 0;
    if (leftYear !== rightYear) return rightYear - leftYear;

    // 2. Prioridade: Data de lançamento ou data do scrape
    const leftDate = toTimestamp(left.releaseDate);
    const rightDate = toTimestamp(right.releaseDate);
    if (leftDate !== rightDate) return rightDate - leftDate;

    // 3. Desempate final: Data do último episódio
    const leftEpDate = left.episodes.length ? toTimestamp(left.episodes[left.episodes.length - 1].createdAt) : 0;
    const rightEpDate = right.episodes.length ? toTimestamp(right.episodes[right.episodes.length - 1].createdAt) : 0;
    return rightEpDate - leftEpDate;
  });

  return deduplicateAnimes(sorted, limit);
}

export function getNewestAnimes(animes: Anime[], limit = 10) {
  return [...animes]
    .sort((left, right) => toTimestamp(right.releaseDate) - toTimestamp(left.releaseDate) || getAnimeRating(right) - getAnimeRating(left))
    .slice(0, limit);
}

export function getRecommendedAnimes(animes: Anime[], limit = 15) {
  const sorted = [...animes]
    .sort((left, right) => getAnimeRating(right) - getAnimeRating(left) || right.episodes.length - left.episodes.length);

  return deduplicateAnimes(sorted, limit);
}

export function mapLatestEpisodesToCatalog(animes: Anime[], latestEpisodes: LatestEpisode[] = []): CatalogEpisode[] {
  return latestEpisodes.map((episode) => {
    const anime = findAnimeBySlug(animes, episode.animeSlug);

    return {
      number: episode.number,
      title: episode.title,
      url: "",
      thumbnail: cleanUrl(episode.image) || cleanUrl(anime?.cover) || "",
      video: episode.video || "",
      createdAt: episode.createdAt,
      animeId: anime?.id || episode.animeSlug,
      animeSlug: episode.animeSlug,
      animeTitle: anime?.title || episode.title.split(" Epis")[0] || episode.animeSlug,
      cover: anime?.cover || "",
      banner: anime ? getBannerImage(anime) : "",
      language: anime ? getLanguageLabel(anime) : "Legendado",
      releaseDate: anime?.releaseDate || "",
      rating: anime ? getAnimeRating(anime) : 0,
    };
  });
}

export function getRecentEpisodes(animes: Anime[]): CatalogEpisode[] {
  return animes
    .flatMap((anime) =>
      anime.episodes.map((episode) => ({
        ...episode,
        animeId: anime.id,
        animeSlug: anime.slug,
        animeTitle: anime.title,
        cover: anime.cover,
        banner: getBannerImage(anime),
        language: getLanguageLabel(anime),
        releaseDate: anime.releaseDate,
        rating: getAnimeRating(anime),
      })),
    )
    .sort((left, right) => {
      const createdDelta = toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
      if (createdDelta !== 0) {
        return createdDelta;
      }

      const releaseDelta = toTimestamp(right.releaseDate) - toTimestamp(left.releaseDate);
      if (releaseDelta !== 0) {
        return releaseDelta;
      }

      return right.number - left.number || right.rating - left.rating;
    });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// === Supabase Site Settings ===

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", "default")
    .single();

  if (error || !data) {
    console.error("Error fetching site settings:", error);
    return {
      id: "default",
      calendar_config: { DOM: [], SEG: [], TER: [], QUA: [], QUI: [], SEX: [], SAB: [] },
      status_map: {},
    };
  }
  return data as SiteSettings;
}

export const siteSettingsQueryOptions = queryOptions({
  queryKey: ["site_settings"],
  queryFn: fetchSiteSettings,
});

export async function updateSiteSettings(config: Partial<SiteSettings>) {
  const { error } = await supabase
    .from("site_settings")
    .update(config)
    .eq("id", "default");

  if (error) {
    throw new Error(error.message);
  }
}

// === Supabase Comments ===

export async function fetchEpisodeComments(animeSlug: string, episodeNumber: string): Promise<EpisodeComment[]> {
  const { data, error } = await supabase
    .from("episode_comments")
    .select("*")
    .eq("anime_slug", animeSlug)
    .eq("episode_number", episodeNumber)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
  return data as EpisodeComment[];
}

export const episodeCommentsQueryOptions = (animeSlug: string, episodeNumber: string) =>
  queryOptions({
    queryKey: ["comments", animeSlug, episodeNumber],
    queryFn: () => fetchEpisodeComments(animeSlug, episodeNumber),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time feel
  });

export async function postEpisodeComment(comment: Omit<EpisodeComment, "id" | "created_at">) {
  const { error } = await supabase.from("episode_comments").insert(comment);
  if (error) {
    throw new Error(error.message);
  }
}



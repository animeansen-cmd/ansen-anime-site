// Site/src/pages/Anime.tsx

import { Suspense, lazy } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Calendar, ChevronRight, Clapperboard, Play, Star } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useSeo } from "@/hooks/useSeo";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { dispatchAuthModal } from "@/lib/authModal";
import {
  buildAnimeSeoDescription,
  buildAnimeSeoKeywords,
  buildAnimeSeoTitle,
  getAltTitleList,
  animeCanonicalUrl,
} from "@/lib/animeSeo";
import { animeQueryOptions, getAnimeRating, getBannerImage, getDisplayGenres, getLanguageLabel } from "@/services/api";
import ChatPanelSkeleton from "@/components/ChatPanelSkeleton";
import SmartPlayer from "@/components/SmartPlayer";

const EpisodeChat = lazy(() => import("@/components/EpisodeChat"));

const Anime = () => {
  const { slug = "" } = useParams();
  const { data: anime, isLoading, isError } = useQuery(animeQueryOptions(slug));
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  let altTitles = anime ? getAltTitleList(anime.altTitle, anime.title) : [];
  let displaySynopsis = anime ? (anime.synopsis || anime.description || "") : "";
  let displayYear = anime?.year;

  if (anime && (displaySynopsis.includes("Título Alternativo:") || displaySynopsis.includes("Sinopse:"))) {
    const altMatch = displaySynopsis.match(/T[íi]tulo Alternativo:\s*(.*?)(?=\n|Sinopse:|$)/i);
    if (altMatch) {
      const extractedAlts = altMatch[1].split(",").map(s => s.trim()).filter(Boolean);
      altTitles = Array.from(new Set([...altTitles, ...extractedAlts]));
    }
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

  useSeo(anime ? {
    title: buildAnimeSeoTitle(anime),
    description: displaySynopsis.substring(0, 160) || buildAnimeSeoDescription(anime),
    canonical: animeCanonicalUrl(anime.slug),
    image: getBannerImage(anime),
    keywords: buildAnimeSeoKeywords(anime),
    structuredData: {
      "@context": "https://schema.org",
      "@type": anime.episodes.length > 1 ? "TVSeries" : "Movie",
      name: anime.title,
      alternateName: altTitles,
      description: displaySynopsis,
      image: [anime.cover, ...anime.banners].filter(Boolean),
      inLanguage: getLanguageLabel(anime) === "Dublado" ? "pt-BR" : "ja-JP",
      datePublished: displayYear || undefined,
      aggregateRating: getAnimeRating(anime) > 0 ? {
        "@type": "AggregateRating",
        ratingValue: getAnimeRating(anime).toFixed(1),
        bestRating: "10",
        worstRating: "0",
        ratingCount: Math.max(anime.episodes.length, 1),
      } : undefined,
    },
  } : {
    title: "Anime | Ansen Animes",
    description: "Catalogo de animes e episodios completos no Ansen Animes.",
  });

  if (isLoading) {
    return (
      <div className="container py-24">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="aspect-[3/4] rounded-3xl skeleton-loading" />
          <div className="space-y-4">
            <div className="h-10 w-1/2 rounded skeleton-loading" />
            <div className="h-5 w-1/3 rounded skeleton-loading" />
            <div className="h-32 rounded skeleton-loading" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !anime) {
    return (
      <div className="container py-24">
        <div className="glass rounded-3xl border border-border p-8 text-center">
          <h1 className="font-heading text-2xl font-bold">Anime nao encontrado</h1>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            Voltar para home
          </Link>
        </div>
      </div>
    );
  }

  if (anime.slug !== slug) return <Navigate to={`/anime/${anime.slug}`} replace />;

  const genres = getDisplayGenres(anime);
  const language = getLanguageLabel(anime);
  const bannerUrl = getBannerImage(anime);
  const firstEpisode = anime.episodes[0];
  const rating = getAnimeRating(anime);
  const favorited = isFavorite(anime.slug);

  const handleFavorite = async () => {
    if (!user) {
      dispatchAuthModal("register");
      return;
    }

    await toggleFavorite({ slug: anime.slug, title: anime.title, cover: anime.cover });
  };

  return (
    <div className="pb-20 md:pb-8">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img referrerPolicy="no-referrer" src={bannerUrl} alt={anime.title} className="h-full w-full object-cover opacity-25 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background" />
        </div>

        <div className="container relative z-10 py-20">
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-end">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
              <img referrerPolicy="no-referrer" src={anime.cover} alt={anime.title} className="aspect-[3/4] w-full object-cover" />
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                <span>{language}</span>
                <span className="text-primary">/</span>
                <span>{displayYear || "Ano indefinido"}</span>
              </div>

              <h1 className="max-w-4xl font-heading text-3xl font-black md:text-5xl">{anime.title}</h1>

              {altTitles.length ? (
                <p className="max-w-4xl text-sm leading-6 text-muted-foreground md:text-base">
                  <span className="font-semibold text-foreground/80">Titulo alternativo:</span>{" "}
                  {altTitles.join(" • ")}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <Link key={genre} to={`/animes?genre=${genre}`}
                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                    {genre}
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clapperboard size={16} className="text-primary" />
                  {anime.episodes.length} episodios
                </span>
                {rating > 0 && (
                  <span className="flex items-center gap-2">
                    <Star size={16} className="fill-primary text-primary" />
                    {rating.toFixed(1)}
                  </span>
                )}
                <Link to={displayYear ? `/animes?year=${displayYear}` : "#"}
                  className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Calendar size={16} className="text-primary" />
                  {displayYear || "Ano indefinido"}
                </Link>
              </div>

              <p className="max-w-4xl text-sm leading-7 text-muted-foreground md:text-base whitespace-pre-line">
                {displaySynopsis}
              </p>

              {/* botões de ação */}
              <div className="flex flex-wrap items-center gap-3">
                {firstEpisode && (
                  <Link
                    to={`/episodio/${anime.slug}/${firstEpisode.number}`}
                    className="glow-primary inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Play size={18} />
                    Assistir episodio {String(firstEpisode.number).padStart(2, "0")}
                  </Link>
                )}

                {/* botão favoritar */}
                <button
                  onClick={handleFavorite}
                  title={user ? (favorited ? "Remover dos favoritos" : "Adicionar aos favoritos") : "Faça login para favoritar"}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${favorited
                      ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                >
                  <Bookmark size={16} className={favorited ? "fill-current" : ""} />
                  {favorited ? "Favoritado" : "Favoritar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {anime?.type === "movie" && anime?.video ? (
        <section className="container mt-10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-2xl font-bold">Assistir Filme</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <SmartPlayer
              videoData={anime.video}
              poster={anime.banners?.[0] || anime.cover}
            />
          </div>
          <Suspense fallback={<ChatPanelSkeleton title="Chat do Filme" />}>
            <EpisodeChat animeSlug={anime.slug} episodeNumber="filme" />
          </Suspense>
        </section>
      ) : (
        <section className="container mt-10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-2xl font-bold">Lista de episodios</h2>
            <span className="text-sm text-muted-foreground">{anime.episodes.length} disponiveis</span>
          </div>

          <div className="grid gap-3">
            {anime.episodes.map(episode => {
              const cleanTitle = episode.title.replace(/^Epis.dio\s*\d+\s*-?\s*/i, "");
              return (
                <Link key={episode.number} to={`/episodio/${anime.slug}/${episode.number}`}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card/70 px-4 py-4 transition-colors hover:border-primary/40 hover:bg-card"
                >
                  {episode.thumbnail && (
                    <div className="hidden flex-shrink-0 overflow-hidden rounded-lg sm:block">
                      <img referrerPolicy="no-referrer" src={episode.thumbnail} alt={episode.title}
                        className="h-16 w-28 object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      Episodio {String(episode.number).padStart(2, "0")}
                    </p>
                    <p className="mt-1 break-words text-sm font-medium md:text-base w-full pr-8">{cleanTitle}</p>
                  </div>
                  <ChevronRight size={18} className="flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Anime;

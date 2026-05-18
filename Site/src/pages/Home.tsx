import { useEffect, useState } from "react";
import { useSeo } from "@/hooks/useSeo";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight, Flame, History, Sparkles } from "lucide-react";
import EpisodeCard from "@/components/EpisodeCard";
import HeroSlider from "@/components/HeroSlider";
import NewAnimesCarousel from "@/components/NewAnimesCarousel";
import RecommendedCarousel from "@/components/RecommendedCarousel";
import NewMoviesCarousel from "@/components/NewMoviesCarousel";
import { readWatchHistory } from "@/lib/watchHistory";
import {
  animesQueryOptions,
  latestEpisodesQueryOptions,
  getFeaturedAnimes,
  getNewAnimes,
  getRecommendedAnimes,
  getRecentEpisodes,
  mapLatestEpisodesToCatalog,
  filterAnimesByCategory,
} from "@/services/api";
import type { CatalogEpisode } from "@/types/anime";

const HOME_EPISODES = 20; // 5x4

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="space-y-2">
          <div className="aspect-[3/4] rounded-2xl skeleton-loading" />
          <div className="h-4 rounded skeleton-loading" />
          <div className="h-3 w-2/3 rounded skeleton-loading" />
        </div>
      ))}
    </div>
  );
}

const Home = () => {
  const { data: animes, isLoading, isError } = useQuery(animesQueryOptions);
  const { data: latestEpisodes } = useQuery(latestEpisodesQueryOptions);
  const [continueWatching, setContinueWatching] = useState<CatalogEpisode[]>([]);

  useSeo({
    title: "Ansen Animes — Assista animes online grátis",
    description: "Assista animes online grátis no Ansen Animes. Episódios legendados e dublados, filmes e lançamentos em dia.",
    canonical: "/",
    keywords: ["animes online", "assistir anime", "animes gratis", "anime dublado", "anime legendado", "ansen animes"],
  });

  useEffect(() => {
    const historyEpisodes = readWatchHistory().map((entry) => ({
      number: entry.episodeNumber,
      title: entry.episodeTitle,
      url: "",
      thumbnail: entry.thumbnail,
      video: null,
      createdAt: entry.visitedAt,
      animeId: entry.animeSlug,
      animeSlug: entry.animeSlug,
      animeTitle: entry.animeTitle,
      cover: entry.cover,
      banner: entry.cover,
      language: entry.language,
      releaseDate: "",
      rating: 0,
    }));

    setContinueWatching(historyEpisodes);
  }, []);

  if (isLoading) {
    return (
      <div className="pb-24 md:pb-8">
        <div className="container mt-2 sm:mt-6">
          <div className="h-[60vh] min-h-[400px] sm:h-[70vh] sm:min-h-[500px] w-full rounded-2xl md:rounded-3xl skeleton-loading" />
        </div>
        <section className="container mt-10">
          <LoadingGrid />
        </section>
      </div>
    );
  }

  if (isError || !animes) {
    return (
      <div className="container py-24">
        <div className="glass rounded-3xl border border-border p-8 text-center">
          <h1 className="font-heading text-2xl font-bold">Nao conseguimos carregar o catalogo</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Verifica se o arquivo <code>/data/animesFull.json</code> foi exportado para o frontend.
          </p>
        </div>
      </div>
    );
  }

  const featuredAnimes = getFeaturedAnimes(animes);
  const newAnimes = getNewAnimes(animes, 24);
  const newMovies = getNewAnimes(filterAnimesByCategory(animes, "filmes"), 24);
  const recommendedAnimes = getRecommendedAnimes(animes, 24);
  const mappedLatest: CatalogEpisode[] = mapLatestEpisodesToCatalog(animes, latestEpisodes || []).slice(0, HOME_EPISODES);

  const recentEpisodes = [...mappedLatest];

  // Se o JSON tiver menos de 20, preenchemos com os mais recentes do catalogo
  if (recentEpisodes.length < HOME_EPISODES) {
    const fallbackEpisodes = getRecentEpisodes(animes);
    for (const fb of fallbackEpisodes) {
      if (recentEpisodes.length >= HOME_EPISODES) break;
      // Impede duplicar episodios que ja vieram do scraper
      if (!recentEpisodes.some((r) => r.animeSlug === fb.animeSlug && r.number === fb.number)) {
        recentEpisodes.push(fb);
      }
    }
  }

  return (
    <div className="pb-24 md:pb-8">
      {/* 1. Hero Slider */}
      <HeroSlider animes={featuredAnimes} />

      {continueWatching.length > 0 && (
        <section className="container mt-10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
                <History size={20} className="text-primary" />
                Continuar assistindo
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Retome de onde voce parou nos ultimos episodios vistos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {continueWatching.slice(0, 8).map((episode, index) => (
              <EpisodeCard
                key={`history-${episode.animeSlug}-${episode.number}`}
                episode={episode}
                index={index}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Novos Animes (carrossel) */}
      <section className="container mt-10 space-y-2">
        <NewAnimesCarousel animes={newAnimes} />
      </section>

      {/* 3. Ultimos lancamentos (preview) - 5x4 */}
      <section className="container mt-14 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
            <Flame size={20} className="text-primary" />
            Ultimos lancamentos
          </h2>
          <Link
            to="/episodios?source=latest"
            className="flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Ver todos
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {recentEpisodes.map((episode, index) => (
            <EpisodeCard
              key={`${episode.animeSlug}-${episode.number}`}
              episode={episode}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* 4. Animes recomendados (carrossel) */}
      <RecommendedCarousel animes={recommendedAnimes} />

      {/* 5. Novos Filmes (carrossel) */}
      <section className="container mt-10 space-y-2">
        <NewMoviesCarousel movies={newMovies} />
      </section>
    </div>
  );
};

export default Home;

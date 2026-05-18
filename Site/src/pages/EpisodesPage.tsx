import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import EpisodeCard from "@/components/EpisodeCard";
import { useSeo } from "@/hooks/useSeo";
import { animesQueryOptions, getRecentEpisodes, latestEpisodesQueryOptions, mapLatestEpisodesToCatalog, paginate } from "@/services/api";

const PAGE_SIZE = 50; // 5x10

const EpisodesPage = () => {
  const { data: animes, isLoading } = useQuery(animesQueryOptions);
  const { data: latestEpisodes, isLoading: isLatestLoading } = useQuery(latestEpisodesQueryOptions);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();

  useSeo({
    title: "Ultimos Episodios | Ansen Animes",
    description: "Assista os episodios mais recentes de todos os animes no Ansen Animes. Atualizacao diaria.",
    canonical: "/episodios",
  });

  if (isLoading || isLatestLoading || !animes) {
    return (
      <div className="container py-24">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-video rounded-xl skeleton-loading" />
              <div className="h-4 rounded skeleton-loading" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const latestCatalog = mapLatestEpisodesToCatalog(animes, latestEpisodes || []);
  const useLatestSource = searchParams.get("source") === "latest" || latestCatalog.length > 0;
  const allEpisodes = useLatestSource && latestCatalog.length > 0 ? latestCatalog : getRecentEpisodes(animes);
  const heading = useLatestSource && latestCatalog.length > 0 ? "Ultimos lancamentos" : "Todos os episodios";
  const totalPages = Math.ceil(allEpisodes.length / PAGE_SIZE);
  const episodes = paginate(allEpisodes, page, PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Mostra ate 7 paginas ao redor da atual
  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, page + 3);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="container py-24 pb-20 md:pb-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 font-heading text-3xl font-black">
          <Flame size={28} className="text-primary" />
          {heading}
        </h1>
        <span className="text-sm text-muted-foreground">
          {allEpisodes.length} episodios - Pagina {page}/{totalPages}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {episodes.map((episode, index) => (
          <EpisodeCard
            key={`${episode.animeSlug}-${episode.number}`}
            episode={episode}
            index={index}
          />
        ))}
      </div>

      {/* Paginacao */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => goTo(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>

          {getPageNumbers().map((p) => (
            <button
              key={p}
              onClick={() => goTo(p)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                page === p
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => goTo(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EpisodesPage;

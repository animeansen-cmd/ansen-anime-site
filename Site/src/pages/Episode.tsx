import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, Clapperboard, ListVideo } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useSeo } from "@/hooks/useSeo";
import {
  buildEpisodeSeoDescription,
  buildEpisodeSeoKeywords,
  buildEpisodeSeoTitle,
  cleanEpisodeTitle,
  getAltTitleList,
  episodeCanonicalUrl,
} from "@/lib/animeSeo";
import { pushWatchHistory } from "@/lib/watchHistory";
import { supabase } from "@/lib/supabase";
import { animeQueryOptions, getBannerImage, getLanguageLabel } from "@/services/api";
import ChatPanelSkeleton from "@/components/ChatPanelSkeleton";
const SmartPlayer = lazy(() => import("@/components/SmartPlayer"));
import ReportErrorModal from "@/components/ReportErrorModal";

const EpisodeChat = lazy(() => import("@/components/EpisodeChat"));

const Episode = () => {
  const { slug = "", episodeNumber = "" } = useParams();
  const parsedEpisodeNumber = Number(episodeNumber);
  const { data: anime, isLoading, isError } = useQuery(animeQueryOptions(slug));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [realViewsCount, setRealViewsCount] = useState<number>(0);
  const [epPage, setEpPage] = useState(0); // página da janela de episódios
  const EP_WINDOW = 60; // qtd de episódios por janela
  const episodeIndex = anime?.episodes.findIndex((item) => item.number === parsedEpisodeNumber) ?? -1;
  const episode = episodeIndex >= 0 && anime ? anime.episodes[episodeIndex] : null;
  const previousEpisode = anime && episodeIndex > 0 ? anime.episodes[episodeIndex - 1] : undefined;
  const nextEpisode = anime && episodeIndex >= 0 ? anime.episodes[episodeIndex + 1] : undefined;
  const cleanTitle = episode ? cleanEpisodeTitle(episode.title) : "";
  const altTitles = anime ? getAltTitleList(anime.altTitle, anime.title) : [];

  // Real-time Views integration
  useEffect(() => {
    if (!anime || !episode) return;
    
    const epNumStr = String(episode.number);
    let mounted = true;

    // Incrementa e busca o valor atualizado
    const incrementAndFetch = async () => {
      const { data, error } = await supabase.rpc("increment_episode_view", {
        p_anime_slug: anime.slug,
        p_episode_number: epNumStr,
      });
      if (mounted && !error && data !== null) {
        setRealViewsCount(data);
      }
    };
    
    incrementAndFetch();

    // Assina as mudanças em tempo real no banco
    const channel = supabase
      .channel(`views_${anime.slug}_${epNumStr}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "episode_views",
          filter: `anime_slug=eq.${anime.slug}`,
        },
        (payload) => {
          if (payload.new && "episode_number" in payload.new) {
            if (payload.new.episode_number === epNumStr) {
              setRealViewsCount(payload.new.views_count);
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [anime, episode]);

  // Janela de episódios: centraliza no episódio atual
  const episodeWindow = useMemo(() => {
    if (!anime) return [];
    const total = anime.episodes.length;
    const totalPages = Math.ceil(total / EP_WINDOW);
    // Determina página inicial com base no episódio atual
    const currentPageForEpisode = episodeIndex >= 0 ? Math.floor(episodeIndex / EP_WINDOW) : 0;
    const page = Math.min(Math.max(epPage, 0), totalPages - 1);
    const resolvedPage = epPage === 0 && episodeIndex >= 0 ? currentPageForEpisode : page;
    return anime.episodes.slice(resolvedPage * EP_WINDOW, resolvedPage * EP_WINDOW + EP_WINDOW);
  }, [anime, episodeIndex, epPage]);

  const totalEpPages = anime ? Math.ceil(anime.episodes.length / EP_WINDOW) : 0;
  const currentEpPage = useMemo(() => {
    if (!anime || episodeIndex < 0) return 0;
    return epPage === 0 && episodeIndex >= 0 ? Math.floor(episodeIndex / EP_WINDOW) : Math.min(Math.max(epPage, 0), totalEpPages - 1);
  }, [anime, episodeIndex, epPage, totalEpPages]);

  // Monetag In-Page Push Ads
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    const script = document.createElement("script");
    script.innerHTML = `(function(s){s.dataset.zone='10913087',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`;
    script.id = "monetag-inpage";
    if (!document.getElementById("monetag-inpage")) {
      document.body.appendChild(script);
    }
    return () => {
      document.getElementById("monetag-inpage")?.remove();
    };
  }, []);

  useSeo(anime && episode ? {
    title: buildEpisodeSeoTitle(anime, episode),
    description: buildEpisodeSeoDescription(anime, episode),
    canonical: episodeCanonicalUrl(anime.slug, episode.number),
    image: episode.thumbnail || anime.cover,
    type: "article",
    keywords: buildEpisodeSeoKeywords(anime, episode),
    structuredData: {
      "@context": "https://schema.org",
      "@type": "TVEpisode",
      name: `${anime.title} Episodio ${String(episode.number).padStart(2, "0")}`,
      alternativeHeadline: cleanTitle || undefined,
      description: anime.synopsis || anime.description || "",
      url: `/episodio/${anime.slug}/${episode.number}`,
      image: [episode.thumbnail, anime.cover].filter(Boolean),
      partOfSeries: {
        "@type": "TVSeries",
        name: anime.title,
        alternateName: altTitles,
      },
      episodeNumber: episode.number,
    },
  } : {
    title: "Episodio | Ansen Animes",
    description: "Assista episodios completos no Ansen Animes.",
  });

  useEffect(() => {
    if (!anime || !episode) return;

    pushWatchHistory({
      animeSlug: anime.slug,
      animeTitle: anime.title,
      episodeNumber: episode.number,
      episodeTitle: episode.title,
      thumbnail: episode.thumbnail || anime.cover,
      cover: getBannerImage(anime) || anime.cover,
      language: getLanguageLabel(anime),
    });
  }, [anime, episode]);

  if (isLoading) {
    return (
      <div className="container py-24">
        <div className="aspect-video rounded-3xl skeleton-loading" />
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

  if (!episode) {
    return (
      <div className="container py-24">
        <div className="glass rounded-3xl border border-border p-8 text-center">
          <h1 className="font-heading text-2xl font-bold">Episodio nao encontrado</h1>
          <Link
            to={`/anime/${anime.slug}`}
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Voltar para o anime
          </Link>
        </div>
      </div>
    );
  }

  if (anime.slug !== slug) {
    return <Navigate to={`/episodio/${anime.slug}/${episode.number}`} replace />;
  }

  return (
    <div className="container py-20 pb-24 md:pb-10">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          {/* Smart Player — lazy loaded: vendor-player só baixa em /episodio/* */}
          <Suspense fallback={<div className="aspect-video rounded-3xl skeleton-loading" />}>
            <SmartPlayer
              videoData={episode.video}
              poster={episode.thumbnail || anime.cover}
            />
          </Suspense>

          <div className="glass rounded-3xl border border-border p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{anime.title}</p>
            {altTitles.length ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground/80">Titulo alternativo:</span>{" "}
                {altTitles.join(" • ")}
              </p>
            ) : null}
            <h1 className="mt-2 font-heading text-2xl font-black md:text-4xl">
              Episodio {String(episode.number).padStart(2, "0")} - {cleanTitle}
            </h1>
            
            <div className="mt-4 flex items-center gap-4">
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-[#F59E0B] hover:bg-card transition-colors"
              >
                Reportar Erro !
              </button>
              <span className="text-sm font-medium text-muted-foreground transition-all duration-500 ease-in-out">
                {new Intl.NumberFormat("pt-BR").format(realViewsCount)} Views
              </span>
            </div>

            <div className="mt-8 flex items-center justify-between gap-2 overflow-x-auto text-[11px] sm:text-sm font-semibold pb-2 scrollbar-hide">
              {/* Botão Anterior */}
              {previousEpisode ? (
                <Link
                  to={`/episodio/${anime.slug}/${previousEpisode.number}`}
                  className="flex-shrink-0 inline-flex items-center gap-1 sm:gap-2 rounded-full border border-border bg-secondary/50 px-3 py-2 text-secondary-foreground transition-colors hover:bg-secondary"
                >
                  <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Episodio</span> anterior
                </Link>
              ) : <div className="flex-shrink-0" />}

              {/* Botão Página Central */}
              <Link
                to={`/anime/${anime.slug}`}
                className="flex-shrink-0 inline-flex items-center gap-1 sm:gap-2 rounded-full border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Clapperboard size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Pagina do</span> anime
              </Link>

              {/* Botão Próximo */}
              {nextEpisode ? (
                <Link
                  to={`/episodio/${anime.slug}/${nextEpisode.number}`}
                  className="flex-shrink-0 glow-primary inline-flex items-center gap-1 sm:gap-2 rounded-full bg-primary px-3 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Proximo <span className="hidden sm:inline">episodio</span>
                  <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                </Link>
              ) : <div className="flex-shrink-0" />}
            </div>
          </div>

          {/* Secao de Comentarios */}
          <Suspense fallback={<ChatPanelSkeleton title="Chat do Episodio" />}>
            <EpisodeChat animeSlug={anime.slug} episodeNumber={String(episode.number)} />
          </Suspense>

          <ReportErrorModal 
            isOpen={isReportModalOpen} 
            onClose={() => setIsReportModalOpen(false)} 
            animeTitle={anime.title} 
            episodeNumber={episode.number} 
          />
        </section>

        {/* Sidebar retratil */}
        <aside className="glass rounded-3xl border border-border xl:sticky xl:top-24 xl:h-fit overflow-hidden">
          {/* Header clicavel para retrair */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-4"
          >
            <div className="flex items-center gap-2">
              <ListVideo size={18} className="text-primary" />
              <h2 className="font-heading text-lg font-bold">Episodios</h2>
              <span className="text-xs text-muted-foreground">({anime.episodes.length})</span>
            </div>
            <ChevronDown
              size={18}
              className={`text-muted-foreground transition-transform duration-200 ${sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Lista de episodios (janela virtualizada) */}
          {sidebarOpen && (
            <div className="flex flex-col">
              {/* Navegação de páginas */}
              {totalEpPages > 1 && (
                <div className="flex items-center justify-between gap-2 px-4 pb-2">
                  <button
                    onClick={() => setEpPage(Math.max(currentEpPage - 1, 0))}
                    disabled={currentEpPage === 0}
                    className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                  >
                    ← Anterior
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {currentEpPage * EP_WINDOW + 1}–{Math.min((currentEpPage + 1) * EP_WINDOW, anime!.episodes.length)} de {anime!.episodes.length}
                  </span>
                  <button
                    onClick={() => setEpPage(Math.min(currentEpPage + 1, totalEpPages - 1))}
                    disabled={currentEpPage >= totalEpPages - 1}
                    className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                  >
                    Próxima →
                  </button>
                </div>
              )}
              <div className="grid max-h-[70vh] gap-2 overflow-y-auto overflow-x-hidden px-4 pb-4">
                {episodeWindow.map((item) => {
                  const isCurrentEpisode = item.number === episode.number;
                  const itemCleanTitle = item.title.replace(/^Epis.dio\s*\d+\s*-?\s*/i, "");

                  return (
                    <Link
                      key={item.number}
                      to={`/episodio/${anime!.slug}/${item.number}`}
                      className={`flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 transition-colors ${
                        isCurrentEpisode
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card/60 hover:border-primary/30 hover:bg-card"
                      }`}
                    >
                      {/* Thumbnail mini */}
                      {item.thumbnail && (
                        <img referrerPolicy="no-referrer"
                          src={item.thumbnail}
                          alt=""
                          className="h-10 w-16 flex-shrink-0 rounded-lg object-cover"
                          loading="lazy"
                          decoding="async"
                          width={64}
                          height={40}
                        />
                      )}
                      <div className="flex-1 overflow-hidden pr-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                          Episodio {String(item.number).padStart(2, "0")}
                        </p>
                        <p className="mt-0.5 text-sm text-foreground line-clamp-3 whitespace-normal break-words">
                          {itemCleanTitle}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Episode;

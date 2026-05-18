import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { getLanguageLabel } from "@/services/api";
import type { Anime } from "@/types/anime";

interface NewAnimesCarouselProps {
  animes: Anime[];
}

const NewAnimesCarousel = ({ animes }: NewAnimesCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animes.length) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: 220, behavior: "smooth" });
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [animes.length]);

  if (!animes.length) return null;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -600, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 600, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
          <Sparkles size={20} className="text-primary" />
          Novos Animes
        </h2>
        <div className="flex items-center gap-2">
          <Link
            to="/animes?type=Anime"
            className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Ver todos &rsaquo;
          </Link>
          <button
            onClick={scrollLeft}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={scrollRight}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Smooth Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory"
      >
        {animes.map((anime, i) => {
          const language = getLanguageLabel(anime);
          return (
            <div
              key={anime.slug}
              className="w-[140px] min-w-[140px] sm:w-[15%] sm:min-w-[180px] xl:w-[calc(16.666%-13.33px)] xl:min-w-[calc(16.666%-13.33px)] flex-shrink-0 snap-start"
            >
              <Link to={`/anime/${anime.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card">
                  <img referrerPolicy="no-referrer"
                    src={anime.cover}
                    alt={anime.title}
                    loading="lazy"
                    decoding="async"
                    width={180}
                    height={240}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />

                  {/* Tag Legendado/Dublado no top-left */}
                  {language !== "Anime" && (
                    <div className="absolute left-0 top-0">
                      <span className={`px-2 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-[11px] font-bold tracking-wide text-white shadow-lg ${
                        language === "Dublado" ? "bg-[#D32F2F]" : "bg-[#1976D2]"
                      }`}>
                        {language}
                      </span>
                    </div>
                  )}

                  <div className="absolute left-2.5 top-2.5 mt-6 sm:mt-8">
                    {language === "Anime" && (
                      <span className="rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                        Novo
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {anime.title}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
        {/* Spacer to prevent right margin cut on PC and Mobile */}
        <div className="w-4 sm:w-8 flex-shrink-0" />
      </div>
    </div>
  );
};

export default NewAnimesCarousel;

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Clapperboard } from "lucide-react";
import { motion } from "framer-motion";
import { getAnimeRating, getDisplayGenres, getLanguageLabel } from "@/services/api";
import type { Anime } from "@/types/anime";

interface RecommendedCarouselProps {
  animes: Anime[];
}

const RecommendedCarousel = ({ animes }: RecommendedCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animes.length) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;

        // If we reach the second half (duplicate part), silently jump back to the first half
        if (scrollLeft >= scrollWidth / 2) {
          scrollRef.current.style.scrollBehavior = "auto";
          scrollRef.current.scrollLeft = scrollLeft - (scrollWidth / 2);
          
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.style.scrollBehavior = "smooth";
              scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
            }
          }, 50);
        } else {
          scrollRef.current.style.scrollBehavior = "smooth";
          scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
      }
    }, 4000);
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
    <section className="container mt-14 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
          <Star size={20} className="fill-primary text-primary" />
          Animes recomendados
        </h2>
        <div className="flex items-center gap-2">
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

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory"
      >
        {[...animes, ...animes].map((anime, i) => {
          const genres = getDisplayGenres(anime);
          const language = getLanguageLabel(anime);
          const rating = getAnimeRating(anime);

          return (
            <motion.div
              key={`${anime.slug}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="w-[140px] min-w-[140px] sm:w-[15%] sm:min-w-[180px] xl:w-[calc(16.666%-13.33px)] xl:min-w-[calc(16.666%-13.33px)] flex-shrink-0 snap-start"
            >
              <Link to={`/anime/${anime.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card">
                  <img referrerPolicy="no-referrer"
                    src={anime.cover}
                    alt={anime.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />

                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                    {rating > 0 && (
                      <span className="flex items-center gap-0.5 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        <Star size={9} className="fill-current" />
                        {rating.toFixed(1)}
                      </span>
                    )}
                    <span className="rounded-full bg-secondary/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-secondary-foreground">
                      {language}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 space-y-1">
                    <p className="truncate text-xs text-muted-foreground">
                      {genres.slice(0, 2).join(" • ") || "Anime"}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Clapperboard size={10} className="text-primary" />
                      <span className="text-[10px] font-semibold text-primary">
                        {anime.episodes.length} eps
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <h3 className="truncate font-heading text-sm font-semibold transition-colors group-hover:text-primary">
                    {anime.title}
                  </h3>
                </div>
              </Link>
            </motion.div>
          );
        })}
        {/* Spacer to prevent right margin cut on PC and Mobile */}
        <div className="w-4 sm:w-8 flex-shrink-0" />
      </div>
    </section>
  );
};

export default RecommendedCarousel;

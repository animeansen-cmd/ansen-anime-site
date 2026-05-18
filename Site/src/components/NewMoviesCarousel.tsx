import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { motion } from "framer-motion";
import { getLanguageLabel } from "@/services/api";
import type { Anime } from "@/types/anime";

interface NewMoviesCarouselProps {
  movies: Anime[];
}

const NewMoviesCarousel = ({ movies }: NewMoviesCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!movies.length) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
         const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
         
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
    }, 3500);
    return () => clearInterval(interval);
  }, [movies.length]);

  if (!movies.length) return null;

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
          <Film size={20} className="text-primary" />
          Novos Filmes
        </h2>
        <div className="flex items-center gap-2">
          <Link
            to="/animes?type=Filme"
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
        {[...movies, ...movies].map((movie, i) => {
          const language = getLanguageLabel(movie);
          return (
            <motion.div
              key={`${movie.slug}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="w-[140px] min-w-[140px] sm:w-[15%] sm:min-w-[180px] xl:w-[calc(16.666%-13.33px)] xl:min-w-[calc(16.666%-13.33px)] flex-shrink-0 snap-start"
            >
              <Link to={`/anime/${movie.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card">
                  <img referrerPolicy="no-referrer"
                    src={movie.cover}
                    alt={movie.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />

                  {/* Badge: idioma (canto esquerdo) */}
                  {language !== "Anime" && (
                    <span className={`absolute left-2 top-2 rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-lg ${
                      language === "Dublado" ? "bg-[#D32F2F]" : "bg-[#1976D2]"
                    }`}>
                      {language}
                    </span>
                  )}
                  {/* Badge: FILME (canto direito) */}
                  <span className="absolute right-2 top-2 rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-lg">
                    FILME
                  </span>

                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {movie.title}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
        {/* Spacer to prevent right margin cut on PC and Mobile */}
        <div className="w-4 sm:w-8 flex-shrink-0" />
      </div>
    </div>
  );
};

export default NewMoviesCarousel;

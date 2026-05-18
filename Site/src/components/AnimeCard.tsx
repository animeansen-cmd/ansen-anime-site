import { useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { getDisplayGenres, getLanguageLabel, isMovie } from "@/services/api";
import type { Anime } from "@/types/anime";

interface AnimeCardProps {
  anime: Anime;
  index?: number;
  showSynopsis?: boolean;
}

const AnimeCard = ({ anime, index = 0, showSynopsis = true }: AnimeCardProps) => {
  const genres = getDisplayGenres(anime);
  const language = getLanguageLabel(anime);
  const [imgSrc, setImgSrc] = useState(anime.cover);
  const [imgBroken, setImgBroken] = useState(false);

  const handleImgError = () => {
    // Plano B: tenta a URL com sufixo de dimensão original
    if (imgSrc === anime.cover && anime.coverFallback && anime.coverFallback !== anime.cover) {
      setImgSrc(anime.coverFallback);
      return;
    }
    // Plano C: placeholder
    setImgBroken(true);
  };

  return (
    <motion.div
      initial={index < 10 ? { opacity: 0, y: 20 } : false}
      animate={index < 10 ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: Math.min(index, 9) * 0.04 }}
    >
      <Link to={`/anime/${anime.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] border border-border bg-card">
          {imgBroken ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/30">
              <ImageOff size={28} className="text-muted-foreground/40" />
              <p className="px-3 text-center text-[10px] text-muted-foreground/60 line-clamp-2">{anime.title}</p>
            </div>
          ) : (
            <img
              referrerPolicy="no-referrer"
              src={imgSrc}
              alt={anime.title}
              loading={index < 10 ? "eager" : "lazy"}
              fetchPriority={index < 5 ? "high" : "auto"}
              decoding={index < 5 ? "sync" : "async"}
              width={300}
              height={400}
              onError={handleImgError}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 [image-rendering:high-quality]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />

          {language !== "Anime" && (
            <div className="absolute left-0 top-0 flex items-center gap-2">
              <span className={`px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-lg ${
                language === "Dublado"
                  ? "bg-[#D32F2F]"
                  : "bg-[#1976D2]"
              }`}>
                {language}
              </span>
            </div>
          )}

          <div className="absolute right-2 top-2 flex items-center gap-2">
            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {anime.year || "Ano"}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
            <p className="truncate text-xs text-muted-foreground">
              {genres.slice(0, 2).join("   ") || "Catalogo"}
            </p>
            <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
              <Clapperboard size={10} />
              {isMovie(anime) ? "Filme" : anime.episodes.length}
            </span>
          </div>
        </div>

        <div className={`mt-3 ${showSynopsis ? "space-y-1" : ""}`}>
          <h3 className="truncate font-heading text-sm font-semibold transition-colors group-hover:text-primary">
            {anime.title}
          </h3>
          {showSynopsis && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {anime.synopsis || "Sem sinopse disponivel no momento."}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default AnimeCard;



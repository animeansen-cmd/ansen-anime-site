import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import type { CatalogEpisode } from "@/types/anime";

interface EpisodeCardProps {
  episode: CatalogEpisode;
  index?: number;
}

const EpisodeCard = ({ episode, index = 0 }: EpisodeCardProps) => {
  return (
    <motion.div
      initial={index < 8 ? { opacity: 0, y: 20 } : false}
      animate={index < 8 ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: Math.min(index, 7) * 0.03 }}
    >
      <Link to={`/episodio/${episode.animeSlug}/${episode.number}`} className="group block">
        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-card">
          <img referrerPolicy="no-referrer"
            src={episode.thumbnail || episode.cover}
            alt={episode.title}
            loading={index < 4 ? "eager" : "lazy"}
            decoding="async"
            width={320}
            height={180}
            className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-50"
          />
          {/* Overlay escuro por padrão */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-background/10 transition-opacity duration-300 group-hover:opacity-70" />

          {/* Tag Legendado/Dublado */}
          {episode.language !== "Anime" && (
            <div className="absolute left-0 top-0">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg ${
                episode.language === "Dublado"
                  ? "bg-[#D32F2F]"
                  : "bg-[#1976D2]"
              }`}>
                {episode.language}
              </span>
            </div>
          )}

          {/* Play button no centro */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm">
              <Play size={20} className="translate-x-[1px]" />
            </div>
          </div>

          {/* Número do episódio */}
          <div className="absolute bottom-2 right-2">
            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              EP {String(episode.number).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Info abaixo */}
        <div className="mt-2 space-y-0.5">
          <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
            Episódio {String(episode.number).padStart(2, "0")} - {episode.title.replace(/^Episódio\s*\d+\s*-?\s*/i, "")}
          </p>
          <div className="flex items-center gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {episode.animeTitle}
            </p>
            <span className={`flex-shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase ${
              episode.language === "Dublado"
                ? "bg-blue-600/20 text-blue-400"
                : "bg-emerald-600/20 text-emerald-400"
            }`}>
              {episode.language === "Dublado" ? "DUB" : "LEG"}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EpisodeCard;

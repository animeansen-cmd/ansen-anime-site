import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Calendar, ChevronLeft, ChevronRight, MonitorPlay, Play, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAnimeRating, getBannerImage, getDisplayGenres, getLanguageLabel, isMovie, siteSettingsQueryOptions } from "@/services/api";
import type { Anime } from "@/types/anime";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { dispatchAuthModal } from "@/lib/authModal";

interface HeroSliderProps {
  animes: Anime[];
}

const HeroSlider = ({ animes }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const { data: siteSettings } = useQuery(siteSettingsQueryOptions);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const statusMap = siteSettings?.status_map || {};
  const featured = animes.slice(0, 5);

  useEffect(() => {
    if (!featured.length) {
      return undefined;
    }

    const timer = setInterval(() => setCurrent((value) => (value + 1) % featured.length), 6000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (!featured.length) {
    return null;
  }

  const anime = featured[current];
  const genres = getDisplayGenres(anime);
  const language = getLanguageLabel(anime);
  const bannerUrl = getBannerImage(anime);
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
    <div className="container mt-2 sm:mt-6">
      <div className="relative h-[60vh] min-h-[400px] sm:h-[70vh] sm:min-h-[500px] w-full overflow-hidden rounded-2xl md:rounded-3xl border border-border/50 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={anime.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <img referrerPolicy="no-referrer"
              src={bannerUrl}
              alt={anime.title}
              className="h-full w-full object-cover object-top"
              loading={current === 0 ? "eager" : "lazy"}
              fetchPriority={current === 0 ? "high" : "auto"}
              decoding={current === 0 ? "sync" : "async"}
              width={1280}
              height={720}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent sm:via-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 pointer-events-none flex items-center w-full z-10">
          <div className="pointer-events-auto h-full w-full flex flex-col justify-end pb-24 sm:justify-center sm:pb-0 px-6 sm:px-10 lg:px-16">
            <div className="grid w-full items-center sm:max-w-3xl lg:max-w-4xl">
              <AnimatePresence>
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="col-start-1 row-start-1 w-full space-y-3 sm:space-y-4"
                >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded px-2 py-1 font-semibold ${
                     statusMap[anime.slug] === "COMPLETO" ? "bg-emerald-600/20 text-emerald-400" : "bg-primary text-primary-foreground"
                  }`}>
                    {statusMap[anime.slug] === "COMPLETO" ? "COMPLETO" : "EM LANCAMENTO"}
                  </span>
                  {isMovie(anime) ? (
                    <span className="rounded bg-secondary/80 backdrop-blur-sm px-2 py-1 text-secondary-foreground">
                      Filme
                    </span>
                  ) : (
                    <span className="rounded bg-secondary/80 backdrop-blur-sm px-2 py-1 text-secondary-foreground">
                      {anime.episodes.length} Episodios
                    </span>
                  )}
                  <span className="rounded bg-secondary/80 backdrop-blur-sm px-2 py-1 text-secondary-foreground">
                    {language}
                  </span>
                </div>

                <h2 className="font-heading text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:text-6xl text-white drop-shadow-lg">
                  {anime.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200 drop-shadow">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {anime.year || "Ano indefinido"}
                  </span>
                  {rating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star size={14} className="fill-current" />
                      {rating.toFixed(1)}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <MonitorPlay size={14} />
                    HD
                  </span>
                  <span>{genres.slice(0, 3).join(" • ") || "Anime"}</span>
                </div>

                <p className="line-clamp-2 sm:line-clamp-3 text-sm leading-relaxed text-gray-200 max-w-2xl drop-shadow-md">
                  {anime.synopsis}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    to={`/anime/${anime.slug}`}
                    className="glow-primary flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 sm:px-6 sm:text-base"
                  >
                    <Play size={18} />
                    Ver Anime
                  </Link>
                  <button
                    onClick={handleFavorite}
                    className={`flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full border px-4 py-3 text-sm font-semibold transition-colors ${
                      favorited ? "border-white/20 text-white" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <Bookmark size={18} className={favorited ? "fill-current" : ""} />
                    {favorited ? "Favoritado" : "Favoritar"}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-4 sm:bottom-6 pointer-events-none z-20">
          <div className="flex w-full justify-end px-6 sm:px-10 lg:px-16">
            <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto">
              <div className="flex gap-1 pr-2 sm:pr-4">
                {featured.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrent(index)}
                    className={`h-1.5 sm:h-2 rounded-full transition-all ${index === current ? "w-4 sm:w-6 bg-primary" : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrent((value) => (value - 1 + featured.length) % featured.length)}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:bg-white/20 bg-black/40 backdrop-blur-md text-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrent((value) => (value + 1) % featured.length)}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:bg-white/20 bg-black/40 backdrop-blur-md text-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;

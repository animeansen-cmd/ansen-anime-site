import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Play } from "lucide-react";
import { animesQueryOptions, getLanguageLabel, getDisplayGenres, siteSettingsQueryOptions } from "@/services/api";
import { useSeo } from "@/hooks/useSeo";
import type { Anime } from "@/types/anime";

const DAY_NAMES = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

function getWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=DOM
  const dates: { id: string; label: string; date: string; fullDate: Date }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dayOfWeek + i);
    dates.push({
      id: DAY_NAMES[i],
      label: DAY_NAMES[i],
      date: d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }).toUpperCase(),
      fullDate: d,
    });
  }
  return dates;
}

export default function CalendarioPage() {
  const { data: animes } = useQuery(animesQueryOptions);

  useSeo({
    title: "Calendario Semanal | Ansen Animes",
    description: "Veja quais animes estao sendo lancados em cada dia da semana no Ansen Animes.",
    canonical: "/calendario",
  });

  const { data: siteSettings, isLoading: settingsLoading } = useQuery(siteSettingsQueryOptions);

  const todayIndex = new Date().getDay();
  const [activeDay, setActiveDay] = useState(DAY_NAMES[todayIndex]);

  const weekDates = useMemo(() => getWeekDates(), []);

  if (!animes || settingsLoading) {
    return (
      <div className="container py-24">
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="h-8 w-48 rounded skeleton-loading" />
          <div className="h-64 w-full rounded-2xl skeleton-loading" />
        </div>
      </div>
    );
  }

  const getAnimesForDay = (day: string) => {
    const slugs = siteSettings?.calendar_config?.[day] || [];
    return slugs
      .map((slug) => animes.find((anime) => anime.slug === slug))
      .filter((anime): anime is Anime => Boolean(anime));
  };

  const activeAnimes = getAnimesForDay(activeDay);

  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;

  return (
    <div className="container py-24 pb-20 md:pb-8">
      <div className="rounded-2xl border border-border bg-[#0A0A0B] p-6 shadow-2xl md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="flex items-center gap-3 font-heading text-2xl font-black text-white md:text-3xl">
            <Calendar size={28} />
            Calendario Semanal
          </h1>
          <span className="text-sm text-muted-foreground">{dateStr}</span>
        </div>

        {/* Tabs de dias */}
        <div className="flex overflow-x-auto border-b border-white/10 custom-scrollbar">
          {weekDates.map((day) => {
            const isActive = day.id === activeDay;
            const isToday = day.id === DAY_NAMES[todayIndex];
            return (
              <button
                key={day.id}
                onClick={() => setActiveDay(day.id)}
                className={`relative flex min-w-[100px] flex-1 flex-col items-center justify-center p-4 text-sm transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-white/80"
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider">{day.date}</span>
                <span className="mt-1 font-heading text-2xl font-black">{day.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-t bg-primary" />
                )}
                {isToday && !isActive && (
                  <div className="absolute bottom-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-t bg-white/30" />
                )}
              </button>
            );
          })}
        </div>

        {/* Conteudo do dia */}
        <div className="mt-8 min-h-[200px]">
          {activeAnimes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Calendar size={48} className="text-muted-foreground/30" />
              <p className="font-bold text-foreground">Nenhum anime em lancamento nesse dia.</p>
              <p className="text-sm text-muted-foreground">
                Pode ser que o pessoal ainda esteja animando os episodios... 🎨
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeAnimes.map((anime) => {
                const language = getLanguageLabel(anime);
                const genres = getDisplayGenres(anime);
                const status = siteSettings?.status_map?.[anime.slug] || "LANCAMENTO";

                return (
                  <Link
                    to={`/anime/${anime.slug}`}
                    key={anime.slug}
                    className="group relative flex gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-primary/30 hover:bg-white/[0.06]"
                  >
                    {/* Thumb */}
                    <div className="aspect-[3/4] w-28 flex-shrink-0 overflow-hidden rounded-lg">
                      <img referrerPolicy="no-referrer"
                        src={anime.cover}
                        alt={anime.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-col justify-center gap-1.5">
                      <h3 className="line-clamp-2 text-sm font-bold uppercase text-white">
                        {anime.title}
                      </h3>

                      {/* Tags */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          status === "COMPLETO"
                            ? "bg-emerald-600/20 text-emerald-400"
                            : "bg-primary/20 text-primary"
                        }`}>
                          {status === "COMPLETO" ? "Completo" : "Lancamento"}
                        </span>
                        <span className="flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/70">
                          <Clock size={9} /> 24 min
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          language === "Dublado"
                            ? "bg-[#D32F2F]/20 text-red-400"
                            : "bg-[#1976D2]/20 text-blue-400"
                        }`}>
                          {language === "Anime" ? "Legendado" : language}
                        </span>
                      </div>

                      {/* Generos */}
                      <div className="mt-auto flex flex-wrap gap-1 pt-2">
                        {genres.slice(0, 3).map((g: string) => (
                          <span
                            key={g}
                            className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40"
                          >
                            {g}
                          </span>
                        ))}
                      </div>

                      {/* Link para episodios */}
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary transition-colors group-hover:bg-primary/20">
                          <Play size={10} /> Ver Lista de Episodios
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

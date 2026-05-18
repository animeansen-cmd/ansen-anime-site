import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, PlayCircle, Clock } from "lucide-react";
import { animesQueryOptions, getLanguageLabel } from "@/services/api";
import type { Anime } from "@/types/anime";

const DAYS = [
  { id: "DOM", label: "DOM", date: "5 DE ABRIL" },
  { id: "SEG", label: "SEG", date: "6 DE ABRIL" },
  { id: "TER", label: "TER", date: "7 DE ABRIL" },
  { id: "QUA", label: "QUA", date: "8 DE ABRIL" },
  { id: "QUI", label: "QUI", date: "9 DE ABRIL" },
  { id: "SEX", label: "SEX", date: "10 DE ABRIL" },
  { id: "SAB", label: "SAB", date: "11 DE ABRIL" }
];

export default function CalendarioSemanal() {
  const { data: animes } = useQuery(animesQueryOptions);
  
  const [activeDay, setActiveDay] = useState("SAB");
  const [calendarConfig, setCalendarConfig] = useState<Record<string, string[]>>({});
  
  useEffect(() => {
    const saved = localStorage.getItem("ansen_cal");
    if (saved) {
      setCalendarConfig(JSON.parse(saved));
    }
  }, []);

  if (!animes) return null;

  const getAnimesForDay = (day: string) => {
    const slugs = calendarConfig[day] || [];
    return slugs
      .map((slug) => animes.find((anime) => anime.slug === slug))
      .filter((anime): anime is Anime => Boolean(anime));
  };

  const activeAnimes = getAnimesForDay(activeDay);

  // Se nao configurou nada, esconde
  if (Object.keys(calendarConfig).length === 0) return null;

  return (
    <div className="container mt-14 overflow-hidden">
      <div className="rounded-2xl border border-border bg-[#0B0B0C] p-6 text-white shadow-2xl">
        <h2 className="mb-6 flex items-center gap-2 font-heading text-xl font-bold">
          <Calendar className="text-white" />
          Calendário Semanal 
          <span className="text-xs font-normal text-muted-foreground ml-auto">{new Date().toLocaleDateString("pt-BR", {dateStyle: "short"})}</span>
        </h2>
        
        {/* Header dos dias */}
        <div className="flex border-b border-white/10 overflow-x-auto custom-scrollbar">
          {DAYS.map(day => {
            const isActive = day.id === activeDay;
            return (
              <button 
                key={day.id} 
                onClick={() => setActiveDay(day.id)}
                className={`flex-1 flex min-w-[80px] flex-col items-center justify-center p-3 text-sm transition-colors ${
                  isActive 
                    ? "border-b-2 border-primary text-white" 
                    : "text-muted-foreground hover:text-white/80"
                }`}
              >
                <span className="text-[10px] uppercase">{day.date}</span>
                <span className="font-heading text-xl font-black">{day.label}</span>
              </button>
            )
          })}
        </div>

        {/* Lista de animes do dia */}
        <div className="mt-6 mb-2 flex flex-col gap-4">
          {activeAnimes.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum anime agendado para este dia.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAnimes.map((anime) => (
                <Link to={`/anime/${anime.slug}`} key={anime.slug} className="group relative flex gap-4 overflow-hidden rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10">
                  <div className="aspect-[3/4] w-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <img referrerPolicy="no-referrer" src={anime.cover} alt={anime.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <p className="text-[10px] font-bold text-primary">Novos episódios hoje</p>
                    <h3 className="line-clamp-2 text-sm font-bold uppercase">{anime.title}</h3>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                       <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">Lançamento</span>
                       <span className="flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/80"><Clock size={10} />24 min</span>
                       <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/80">{getLanguageLabel(anime)}</span>
                    </div>

                    <div className="mt-auto pt-2 flex gap-1">
                      {anime.genres.slice(0, 3).map((g: string) => (
                        <span key={g} className="rounded bg-black/40 px-1.5 py-1 text-[9px] text-white/50">{g}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

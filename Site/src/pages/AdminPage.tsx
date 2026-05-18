import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, Download, Calendar, Activity, Search, X, Plus, Trash2, Lock } from "lucide-react";
import { animesQueryOptions, siteSettingsQueryOptions, updateSiteSettings } from "@/services/api";
import { toast } from "sonner";

const DAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { data: animes } = useQuery(animesQueryOptions);
  const { data: siteSettings, refetch } = useQuery(siteSettingsQueryOptions);

  const [calendar, setCalendar] = useState<Record<string, string[]>>({
    DOM: [], SEG: [], TER: [], QUA: [], QUI: [], SEX: [], SAB: [],
  });
  const [statusMap, setStatusMap] = useState<Record<string, "LANCAMENTO" | "COMPLETO">>({});
  const [activeDay, setActiveDay] = useState("DOM");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [statusPage, setStatusPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  useEffect(() => {
    if (siteSettings) {
      setCalendar(siteSettings.calendar_config);
      setStatusMap(siteSettings.status_map);
    }
    
    // Check auth from session
    const authSession = sessionStorage.getItem("admin_auth");
    if (authSession === "true") {
      setIsAuthenticated(true);
    }
  }, [siteSettings]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "Diasigor1@outlook.com" && password === "Porcoespinho1@") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      alert("Credenciais invalidas!");
    }
  };

  const saveToSupabase = async () => {
    try {
      await updateSiteSettings({
        calendar_config: calendar,
        status_map: statusMap,
      });
      toast.success("Salvo na nuvem com sucesso!");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar no banco de dados.");
    }
  };

  const exportConfig = () => {
    const payload = { calendar, statusMap };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "adminConfig.json";
    a.click();
  };

  const addAnimeToDay = (slug: string) => {
    setCalendar((prev) => {
      const cloned = { ...prev };
      if (!cloned[activeDay].includes(slug)) {
        cloned[activeDay] = [...cloned[activeDay], slug];
      }
      return cloned;
    });
    setSearchQuery("");
  };

  const removeAnimeFromDay = (day: string, slug: string) => {
    setCalendar((prev) => {
      const cloned = { ...prev };
      cloned[day] = cloned[day].filter((s) => s !== slug);
      return cloned;
    });
  };

  const setAnimeStatus = (slug: string, status: "LANCAMENTO" | "COMPLETO") => {
    setStatusMap((prev) => ({ ...prev, [slug]: status }));
  };

  // Resultados da busca para adicionar ao dia
  const searchResults = useMemo(() => {
    if (!animes || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return animes
      .filter((a) => a.title.toLowerCase().includes(q))
      .filter((a) => !calendar[activeDay].includes(a.slug))
      .slice(0, 8);
  }, [animes, searchQuery, activeDay, calendar]);

  // Resultados da busca de status com paginacao
  const filteredStatusAnimes = useMemo(() => {
    if (!animes) return [];
    if (statusSearch.length < 2) return animes;
    const q = statusSearch.toLowerCase();
    return animes.filter((a) => a.title.toLowerCase().includes(q));
  }, [animes, statusSearch]);

  const totalPages = Math.ceil(filteredStatusAnimes.length / ITEMS_PER_PAGE);

  const statusResults = useMemo(() => {
    const start = (statusPage - 1) * ITEMS_PER_PAGE;
    return filteredStatusAnimes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStatusAnimes, statusPage]);

  if (!animes) return <div className="container py-24 text-center">Carregando...</div>;

  if (!isAuthenticated) {
    return (
      <div className="container py-24 flex items-center justify-center min-h-[70vh]">
        <div className="glass w-full max-w-sm rounded-3xl p-8 border border-border shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/20 p-3 rounded-full">
              <Lock className="text-primary" size={28} />
            </div>
          </div>
          <h2 className="text-2xl font-heading font-black text-center mb-6">Acesso Restrito</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm text-foreground outline-none focus:border-primary transition-colors" 
                placeholder="Seu email" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Senha</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm text-foreground outline-none focus:border-primary transition-colors" 
                placeholder="Sua senha" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full rounded-lg bg-primary py-3 px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90 mt-2"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-24 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-black">Painel Administrativo</h1>
        <div className="flex gap-3">
          <button onClick={saveToSupabase} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90">
            <Save size={16} /> Salvar
          </button>
          <button onClick={exportConfig} className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary">
            <Download size={16} /> Exportar JSON
          </button>
        </div>
      </div>

      {/* ===================== CALENDARIO ===================== */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-6 flex items-center gap-2 font-heading text-xl font-bold">
          <Calendar size={20} className="text-primary" /> Calendario Semanal
        </h2>

        {/* Tabs dos dias */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                activeDay === day
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {day}
              {calendar[day].length > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                  {calendar[day].length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Busca de anime para o dia selecionado */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Pesquisar anime para adicionar em ${activeDay}...`}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground outline-none focus:border-primary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}

          {/* Dropdown de resultados */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
              {searchResults.map((anime) => (
                <button
                  key={anime.slug}
                  onClick={() => addAnimeToDay(anime.slug)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <img referrerPolicy="no-referrer" src={anime.cover} alt="" className="h-20 w-14 flex-shrink-0 rounded object-cover" />
                  <span className="truncate">{anime.title}</span>
                  <Plus size={14} className="ml-auto flex-shrink-0 text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de animes do dia ativo */}
        <div className="space-y-2">
          {calendar[activeDay].length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum anime em {activeDay}. Use a busca acima para adicionar.
            </p>
          ) : (
            calendar[activeDay].map((slug) => {
              const anime = animes.find((a) => a.slug === slug);
              if (!anime) return null;
              return (
                <div key={slug} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background p-3">
                  <img referrerPolicy="no-referrer" src={anime.cover} alt="" className="h-20 w-14 flex-shrink-0 rounded object-cover" />
                  <span className="flex-1 truncate text-sm font-medium">{anime.title}</span>
                  <button
                    onClick={() => removeAnimeFromDay(activeDay, slug)}
                    className="flex-shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===================== STATUS ===================== */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold">
          <Activity size={20} className="text-emerald-500" /> Status de Lancamento
        </h2>

        {/* Busca de status */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={statusSearch}
            onChange={(e) => {
              setStatusSearch(e.target.value);
              setStatusPage(1);
            }}
            placeholder="Pesquisar anime para alterar status..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {statusResults.map((anime) => {
            const status = statusMap[anime.slug] || "LANCAMENTO";
            return (
              <div key={anime.slug} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background p-3">
                <img referrerPolicy="no-referrer" src={anime.cover} alt="" className="h-24 w-16 flex-shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold" title={anime.title}>{anime.title}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    <button
                      onClick={() => setAnimeStatus(anime.slug, "LANCAMENTO")}
                      className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
                        status === "LANCAMENTO" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      Lancamento
                    </button>
                    <button
                      onClick={() => setAnimeStatus(anime.slug, "COMPLETO")}
                      className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
                        status === "COMPLETO" ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      Completo
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controles de paginacao */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setStatusPage((p) => Math.max(1, p - 1))}
              disabled={statusPage === 1}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary px-5 py-2 text-sm font-bold text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="rounded-lg bg-background px-4 py-2 text-sm font-bold text-muted-foreground shadow-sm">
              Pagina {statusPage} de {totalPages}
            </span>
            <button
              onClick={() => setStatusPage((p) => Math.min(totalPages, p + 1))}
              disabled={statusPage === totalPages}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary px-5 py-2 text-sm font-bold text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
            >
              Proxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

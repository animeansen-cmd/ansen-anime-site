import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Filter, Sparkles, X } from "lucide-react";
import AnimeCard from "@/components/AnimeCard";
import { useSeo } from "@/hooks/useSeo";
import { animesQueryOptions, getDisplayGenres, getLanguageLabel, paginate, getNewAnimes } from "@/services/api";

const PAGE_SIZE = 30;

const GENRE_OPTIONS = [
  "Acao", "Acao e Aventura", "Aventura", "Comedia", "Drama",
  "Fantasia", "Misterio", "Sci-Fi", "Sci-Fi & Fantasia", "Shounen",
  "War & Politics",
];

const NovosAnimesPage = () => {
  const { data: animes, isLoading } = useQuery(animesQueryOptions);
  const [page, setPage] = useState(1);
  const [genreFilter, setGenreFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const [searchParams] = useSearchParams();

  useSeo({
    title: "Novos Animes | Ansen Animes",
    description: "Descubra os animes mais recentes adicionados ao catalogo do Ansen Animes. Atualizacao constante.",
    canonical: "/novosanimes",
  });

  useEffect(() => {
    const lang = searchParams.get("lang");
    if (lang) setLangFilter(lang);
  }, [searchParams]);

  const availableYears = useMemo(() => {
    if (!animes) return [];
    const years = new Set<string>();
    animes.forEach((a) => { if (a.year) years.add(a.year); });
    return Array.from(years).sort().reverse();
  }, [animes]);

  const availableGenres = useMemo(() => {
    if (!animes) return GENRE_OPTIONS;
    const genreSet = new Set<string>();
    animes.forEach((a) => {
      getDisplayGenres(a).forEach((g) => genreSet.add(g));
    });
    return Array.from(genreSet).sort();
  }, [animes]);

  const filtered = useMemo(() => {
    if (!animes) return [];
    
    // Pega todos os animes, ordenados pelo criterio de 'Nova Data'
    let result = getNewAnimes(animes, animes.length);

    if (genreFilter) {
      result = result.filter((a) =>
        getDisplayGenres(a).some((g) => g.toLowerCase().includes(genreFilter.toLowerCase()))
      );
    }

    if (yearFilter) {
      result = result.filter((a) => a.year === yearFilter);
    }

    if (langFilter) {
      result = result.filter((a) => getLanguageLabel(a) === langFilter);
    }

    return result;
  }, [animes, genreFilter, yearFilter, langFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const displayed = paginate(filtered, page, PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setGenreFilter("");
    setYearFilter("");
    setLangFilter("");
    setPage(1);
  };

  const hasFilters = genreFilter || yearFilter || langFilter;

  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, page + 3);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  if (isLoading || !animes) {
    return (
      <div className="container py-24">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] rounded-2xl skeleton-loading" />
              <div className="h-4 rounded skeleton-loading" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-24 pb-20 md:pb-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 font-heading text-3xl font-black">
          <Sparkles size={28} className="text-primary" />
          Novos Animes
        </h1>
        <span className="text-sm text-muted-foreground">
          {filtered.length} animes
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Filtros lateral */}
        <aside className="space-y-6">
          <div className="glass rounded-2xl border border-border p-4 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-heading text-sm font-bold">
                <Filter size={14} className="text-primary" />
                Filtros
              </h3>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                  Limpar
                </button>
              )}
            </div>

            {/* Idioma */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Idioma
              </label>
              <div className="flex flex-wrap gap-2">
                {["Legendado", "Dublado"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setLangFilter(langFilter === lang ? "" : lang); setPage(1); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      langFilter === lang
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Ano */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ano
              </label>
              <select
                value={yearFilter}
                onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Todos os anos</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Genero */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Genero
              </label>
              <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
                {availableGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => { setGenreFilter(genreFilter === genre ? "" : genre); setPage(1); }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      genreFilter === genre
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Grid de animes */}
        <div className="space-y-8">
          {displayed.length === 0 ? (
            <div className="glass rounded-3xl border border-border p-12 text-center">
              <p className="text-muted-foreground">Nenhum anime encontrado com esses filtros.</p>
              <button onClick={clearFilters} className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {displayed.map((anime, index) => (
                <AnimeCard key={anime.slug} anime={anime} index={index} />
              ))}
            </div>
          )}

          {/* Paginacao */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => goTo(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => goTo(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovosAnimesPage;

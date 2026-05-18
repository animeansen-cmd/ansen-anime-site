import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, Clapperboard, Filter, Sparkles } from "lucide-react";
import AnimeCard from "@/components/AnimeCard";
import { useSeo } from "@/hooks/useSeo";
import { animesQueryOptions, getCatalogAnimes, getDisplayGenres, getLanguageLabel, isMovie, paginate } from "@/services/api";

const PAGE_SIZE = 30;
const DEFAULT_TYPE_FILTER = "Anime";

const GENRE_OPTIONS = [
  "Acao",
  "Aventura",
  "Comedia",
  "Drama",
  "Esportes",
  "Familia",
  "Fantasia",
  "Ficcao Cientifica",
  "Misterio",
  "Romance",
  "Shounen",
  "Suspense",
  "Terror",
];

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
};

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 transition-all duration-300 hover:border-primary/30 hover:bg-white/[0.06]">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
        {label}
      </span>
      <div className="relative mt-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none bg-transparent pr-12 text-sm font-medium text-white outline-none"
        >
          {options.map((option) => (
            <option key={option.value || "all"} value={option.value} className="bg-[#090912] text-white">
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-3 text-white/60">
          <span className="h-5 w-px bg-gradient-to-b from-primary/0 via-primary/80 to-primary/0" />
          <ChevronDown size={16} />
        </div>
      </div>
    </label>
  );
}

const AnimesPage = () => {
  const { data: animes, isLoading } = useQuery(animesQueryOptions);
  const [page, setPage] = useState(1);
  const [genreFilter, setGenreFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(DEFAULT_TYPE_FILTER);
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);

  useSeo({
    title: "Catalogo de Animes | Ansen Animes",
    description: "Explore o catalogo completo de animes e filmes no Ansen Animes. Filtre por genero, ano, idioma e muito mais.",
    canonical: "/animes",
  });

  useEffect(() => {
    const lang = searchParams.get("lang");
    const genre = searchParams.get("genre");
    const year = searchParams.get("year");
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    const normalizedLang = lang === "Dublado" || lang === "Legendado" ? lang : "";
    const normalizedType = type === "Filme" || type === "Anime" ? type : DEFAULT_TYPE_FILTER;

    setGenreFilter(genre || "");
    setYearFilter(year || "");

    if (category === "filmes" || type === "Filme") {
      setTypeFilter("Filme");
      setLangFilter(normalizedLang);
    } else {
      setTypeFilter(normalizedType);
      setLangFilter(normalizedLang);
    }

    setPage(1);
  }, [searchParams]);

  const catalogAnimes = useMemo(() => {
    if (!animes) return [];
    return getCatalogAnimes(animes);
  }, [animes]);

  const availableYears = useMemo(() => {
    if (!catalogAnimes.length) return [];
    const years = new Set<string>();
    catalogAnimes.forEach((anime) => {
      if (anime.year) years.add(anime.year);
    });
    return Array.from(years).sort().reverse();
  }, [catalogAnimes]);

  const availableGenres = useMemo(() => {
    if (!catalogAnimes.length) return GENRE_OPTIONS;
    const genreSet = new Set<string>();
    catalogAnimes.forEach((anime) => {
      getDisplayGenres(anime).forEach((genre) => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [catalogAnimes]);

  const filtered = useMemo(() => {
    if (!catalogAnimes.length) return [];
    let result = [...catalogAnimes];

    if (genreFilter) {
      result = result.filter((anime) =>
        getDisplayGenres(anime).some((genre) => genre.toLowerCase().includes(genreFilter.toLowerCase())),
      );
    }

    if (yearFilter) {
      result = result.filter((anime) => anime.year === yearFilter);
    }

    if (typeFilter === "Anime") {
      result = result.filter((anime) => !isMovie(anime));
    } else if (typeFilter === "Filme") {
      result = result.filter((anime) => isMovie(anime));
    }

    if (langFilter) {
      result = result.filter((anime) => getLanguageLabel(anime) === langFilter);
    }

    result.sort((left, right) => left.title.localeCompare(right.title, "pt-BR"));
    return result;
  }, [catalogAnimes, genreFilter, yearFilter, langFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const displayed = paginate(filtered, page, PAGE_SIZE);

  const hasFilters = Boolean(
    genreFilter ||
    yearFilter ||
    langFilter ||
    typeFilter !== DEFAULT_TYPE_FILTER,
  );

  const activeFilterCount = [genreFilter, yearFilter, langFilter, typeFilter !== DEFAULT_TYPE_FILTER ? typeFilter : ""]
    .filter(Boolean)
    .length;

  const activeFilters = [
    genreFilter ? `Genero: ${genreFilter}` : "",
    yearFilter ? `Ano: ${yearFilter}` : "",
    langFilter ? `Idioma: ${langFilter === "Dublado" ? "DUB" : "LEG"}` : "",
    typeFilter !== DEFAULT_TYPE_FILTER ? `Tipo: ${typeFilter}` : "",
  ].filter(Boolean);

  const goTo = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setGenreFilter("");
    setYearFilter("");
    setLangFilter("");
    setTypeFilter(DEFAULT_TYPE_FILTER);
    setPage(1);
    setSearchParams({});
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, page + 3);

    for (let index = start; index <= end; index += 1) {
      pages.push(index);
    }

    return pages;
  };

  if (isLoading || !animes) {
    return (
      <div className="container py-24">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="space-y-2">
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
          <Clapperboard size={28} className="text-primary" />
          Catalogo Ansen
        </h1>
        <span className="text-sm text-muted-foreground">{filtered.length} titulos</span>
      </div>

      <div className="relative mb-10 overflow-hidden rounded-[32px] border border-white/10 bg-[#070711] px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,109,40,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(147,51,234,0.2),transparent_40%),linear-gradient(135deg,rgba(255,109,40,0.08)_0%,rgba(12,12,22,0.18)_42%,rgba(147,51,234,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(7,7,17,0)_38%,rgba(7,7,17,0.28)_100%)]" />

        <div className="relative">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                <Filter size={14} />
                Refine o catalogo
              </span>

              <div>
                <h3 className="font-heading text-2xl font-black text-white sm:text-3xl">
                  Filtrar Pesquisa
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-white/65">
                  Escolha o tipo de conteudo, idioma, genero e ano para encontrar o proximo anime ou filme sem perder tempo.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3 lg:min-w-[220px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                Resultado atual
              </span>
              <strong className="text-2xl font-black text-white">{filtered.length}</strong>
              <span className="text-xs text-white/55">
                {activeFilterCount > 0 ? `${activeFilterCount} filtros ativos` : "Catalogo pronto pra explorar"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FilterSelect
              label="Genero"
              value={genreFilter}
              onChange={(value) => {
                setGenreFilter(value);
                setPage(1);
              }}
              options={[
                { label: "Todos os generos", value: "" },
                ...availableGenres.map((genre) => ({ label: genre, value: genre })),
              ]}
            />

            <FilterSelect
              label="Ano"
              value={yearFilter}
              onChange={(value) => {
                setYearFilter(value);
                setPage(1);
              }}
              options={[
                { label: "Todos os anos", value: "" },
                ...availableYears.map((year) => ({ label: year, value: year })),
              ]}
            />

            <FilterSelect
              label="Tipo"
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
              options={[
                { label: "Anime", value: "Anime" },
                { label: "Filme", value: "Filme" },
              ]}
            />

            <FilterSelect
              label="DUB / LEG"
              value={langFilter}
              onChange={(value) => {
                setLangFilter(value);
                setPage(1);
              }}
              options={[
                { label: "Todos os idiomas", value: "" },
                { label: "LEG", value: "Legendado" },
                { label: "DUB", value: "Dublado" },
              ]}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {activeFilters.length > 0 ? (
              activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/75"
                >
                  {filter}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-2 text-xs text-white/55">
                <Sparkles size={14} className="text-primary" />
                A selecao padrao mostra os animes do catalogo, mas voce pode abrir filmes a qualquer momento.
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={scrollToResults}
              className="w-full rounded-[22px] bg-[linear-gradient(90deg,rgba(255,109,40,0.95)_0%,rgba(147,51,234,0.9)_100%)] px-4 py-4 text-center text-sm font-black uppercase tracking-[0.28em] text-white transition-transform hover:scale-[1.01]"
            >
              {hasFilters ? `Ver ${filtered.length} resultados` : "Ver lista completa"}
            </button>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-white/65 transition-colors hover:text-white"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      <div ref={resultsRef} className="space-y-8">
        {displayed.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center rounded-3xl border border-border px-4 py-20 text-center">
            <div className="mb-4">
              <Clapperboard size={48} className="mx-auto text-muted-foreground/30" />
            </div>
            {typeFilter === "Filme" ? (
              <p className="text-xl font-bold text-foreground">Sem filmes por aqui ainda!</p>
            ) : (
              <p className="text-xl font-bold text-foreground">
                Poxa, parece que o pirata ainda nao encontrou esse tesouro.
              </p>
            )}
            <p className="mt-2 text-muted-foreground">
              O que acha de tentar buscar por um genero ou ano diferente?
            </p>
            <button
              onClick={clearFilters}
              className="mt-8 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105"
            >
              Limpar filtros e ver tudo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayed.map((anime, index) => (
              <AnimeCard key={anime.slug} anime={anime} index={index} showSynopsis={false} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => goTo(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>

            {getPageNumbers().map((currentPage) => (
              <button
                key={currentPage}
                onClick={() => goTo(currentPage)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {currentPage}
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
  );
};

export default AnimesPage;

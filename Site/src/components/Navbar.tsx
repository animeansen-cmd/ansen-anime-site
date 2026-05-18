// Site/src/components/Navbar.tsx

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Calendar, ChevronDown, Film, Menu, Mic, Search, Shuffle, Star, Subtitles, X } from "lucide-react";
import { animesQueryOptions, getAnimeRating, getCatalogAnimes, getLanguageLabel, matchesAnimeSearch, isMovie } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import AuthModal from "@/components/AuthModal";
import UserMenu from "@/components/UserMenu";
import { AUTH_MODAL_EVENT } from "@/lib/authModal";
import type { AuthModalMode } from "@/lib/authModal";

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [animesMenuOpen, setAnimesMenuOpen] = useState(false);
  const [filmesMenuOpen, setFilmesMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");

  const deferredQuery = useDeferredValue(query.trim());
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { favorites } = useFavorites();

  const { data: animes = [] } = useQuery(animesQueryOptions);
  const animesMenuRef = useRef<HTMLDivElement>(null);
  const filmesMenuRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  const catalogAnimes = useMemo(() => getCatalogAnimes(animes), [animes]);

  const results = useMemo(() => {
    if (deferredQuery.length < 2) return [];
    return catalogAnimes
      .filter(anime => matchesAnimeSearch(anime, deferredQuery))
      .slice(0, 10);
  }, [catalogAnimes, deferredQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (animesMenuRef.current && !animesMenuRef.current.contains(target)) setAnimesMenuOpen(false);
      if (filmesMenuRef.current && !filmesMenuRef.current.contains(target)) setFilmesMenuOpen(false);
      if (searchPanelRef.current && !searchPanelRef.current.contains(target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setAnimesMenuOpen(false);
    setFilmesMenuOpen(false);
    setQuery("");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleOpenAuthModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: AuthModalMode }>;
      setAuthModalMode(customEvent.detail?.mode || "login");
      setAuthModalOpen(true);
    };
    window.addEventListener(AUTH_MODAL_EVENT, handleOpenAuthModal);
    return () => window.removeEventListener(AUTH_MODAL_EVENT, handleOpenAuthModal);
  }, []);

  const openAuthModal = (mode: AuthModalMode = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const animesSubLinks = [
    { label: "Animes Legendados", icon: Subtitles, category: "legendados" },
    { label: "Animes Dublados", icon: Mic, category: "dublados" },
  ];

  const filmesSubLinks = [
    { label: "Filmes Legendados", icon: Subtitles, category: "filmes-legendados" },
    { label: "Filmes Dublados", icon: Mic, category: "filmes-dublados" },
  ];

  const navigateToAnime = (slug: string) => {
    navigate(`/anime/${slug}`);
    setSearchOpen(false);
    setQuery("");
  };

  const handleFavoritesClick = () => {
    if (!user) { openAuthModal("login"); return; }
    navigate("/favoritos");
  };

  return (
    <>
      <header className="glass fixed left-0 right-0 top-0 z-50">
        <div className="container flex h-16 items-center justify-between gap-4">

          {/* logo + hamburger */}
          <div className="flex flex-shrink-0 items-center justify-between gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-secondary lg:hidden"
            >
              <Menu size={20} />
            </button>
            <Link to="/" className="flex-shrink-0">
              <h1 className="font-heading text-xl font-black tracking-tight whitespace-nowrap">
                <span className="text-gradient">ANSEN</span>{" "}
                <span className="rounded-sm bg-primary px-2 py-0.5 text-sm text-primary-foreground tracking-normal">ANIMES</span>
              </h1>
            </Link>
          </div>

          {/* nav desktop */}
          <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground lg:flex">
            <Link to="/" className="rounded-lg px-3 py-2 transition-colors hover:bg-secondary/50 hover:text-foreground">Inicio</Link>
            <Link to="/animes" className="rounded-lg px-3 py-2 transition-colors hover:bg-secondary/50 hover:text-foreground">Catalogo</Link>
            <Link to="/calendario" className="rounded-lg px-3 py-2 transition-colors hover:bg-secondary/50 hover:text-foreground">
              <span className="flex items-center gap-1"><Calendar size={14} />Calendario</span>
            </Link>

            <div ref={animesMenuRef} className="relative">
              <button
                onClick={() => { setAnimesMenuOpen(v => !v); setFilmesMenuOpen(false); }}
                className="flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-secondary/50 hover:text-foreground"
              >
                Animes
                <ChevronDown size={14} className={`transition-transform duration-200 ${animesMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {animesMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="glass absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-xl"
                  >
                    {animesSubLinks.map(link => (
                      <button
                        key={link.category}
                        onClick={() => {
                          setAnimesMenuOpen(false);
                          const langParam = link.category === "legendados" ? "Legendado" : "Dublado";
                          navigate(`/animes?lang=${langParam}`);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                      >
                        <link.icon size={16} className="text-primary" />
                        {link.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dropdown — Filmes */}
            <div ref={filmesMenuRef} className="relative">
              <button
                onClick={() => { setFilmesMenuOpen(v => !v); setAnimesMenuOpen(false); }}
                className="flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-secondary/50 hover:text-foreground"
              >
                <Film size={14} />
                Filmes
                <ChevronDown size={14} className={`transition-transform duration-200 ${filmesMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {filmesMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="glass absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-xl"
                  >
                    {filmesSubLinks.map(link => (
                      <button
                        key={link.category}
                        onClick={() => {
                          setFilmesMenuOpen(false);
                          const langParam = link.category === "filmes-legendados" ? "Legendado" : "Dublado";
                          navigate(`/animes?type=Filme&lang=${langParam}`);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                      >
                        <link.icon size={16} className="text-primary" />
                        {link.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* ações direita */}
          <div className="flex items-center gap-3">

            {/* pesquisa */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(v => !v)}
                className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-primary transition-colors hover:bg-primary/20"
              >
                <Search size={16} />
                <span className="hidden text-sm sm:inline">Pesquisar...</span>
              </button>

              <AnimatePresence>
                {searchOpen && (
                  <>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setSearchOpen(false)}
                      className="fixed inset-0 top-16 z-[55] bg-background/70 backdrop-blur-sm"
                    />
                    <motion.div
                      ref={searchPanelRef}
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      className="fixed left-3 right-3 top-20 z-[60] overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[360px]"
                    >
                      <div className="flex items-center gap-2 border-b border-border p-3">
                        <Search size={16} className="text-muted-foreground" />
                        <input
                          autoFocus value={query}
                          onChange={e => setQuery(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && results[0]) navigateToAnime(results[0].slug); }}
                          placeholder="Pesquisar anime, filme ou titulo alternativo..."
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        <button onClick={() => { setSearchOpen(false); setQuery(""); }}>
                          <X size={16} className="text-muted-foreground" />
                        </button>
                      </div>

                      {results.length > 0 && (
                        <div className="max-h-[65vh] overflow-y-auto p-2 sm:max-h-80">
                          {results.map(anime => {
                            const language = getLanguageLabel(anime);
                            const rating = getAnimeRating(anime);
                            return (
                              <button
                                key={anime.id}
                                onClick={() => navigateToAnime(anime.slug)}
                                className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary/50"
                              >
                                <img referrerPolicy="no-referrer" src={anime.cover} alt={anime.title} className="h-24 w-16 flex-shrink-0 rounded-lg object-cover" />
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-1 text-sm font-semibold text-foreground">{anime.title}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <span>{isMovie(anime) ? "Filme" : `${anime.episodes.length} eps`}</span>
                                    <span className="text-border">/</span>
                                    <span>{anime.year || "Ano indefinido"}</span>
                                    <span className="text-border">/</span>
                                    <span>{language}</span>
                                    {rating > 0 && (
                                      <>
                                        <span className="text-border">/</span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                                          <Star size={10} className="fill-current" />{rating.toFixed(1)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {anime.altTitle && (
                                    <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground/80">{anime.altTitle}</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {deferredQuery.length > 1 && results.length === 0 && (
                        <p className="p-4 text-center text-sm text-muted-foreground">Nenhum resultado encontrado</p>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* anime aleatório */}
            <button
              onClick={() => {
                if (!animes.length) return;
                navigate(`/anime/${animes[Math.floor(Math.random() * animes.length)].slug}`);
              }}
              className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block"
              title="Anime aleatorio"
            >
              <Shuffle size={20} />
            </button>

            {/* favoritos — leva pro /favoritos ou abre login */}
            <button
              onClick={handleFavoritesClick}
              className="relative text-muted-foreground transition-colors hover:text-foreground"
              title="Favoritos"
            >
              <Bookmark size={20} className={favorites.size > 0 && user ? "fill-primary text-primary" : ""} />
              {favorites.size > 0 && user && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {favorites.size > 99 ? "99+" : favorites.size}
                </span>
              )}
            </button>

            {/* usuário / login */}
            <UserMenu onLoginClick={() => openAuthModal("login")} />
          </div>
        </div>
      </header>

      {/* menu mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 top-0 z-[70] w-4/5 max-w-sm overflow-y-auto border-r border-border bg-background p-6 shadow-2xl lg:hidden"
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-heading text-xl font-black tracking-tight whitespace-nowrap">
                  <span className="text-gradient">ANSEN</span>{" "}
                  <span className="rounded-sm bg-primary px-2 py-0.5 text-sm text-primary-foreground tracking-normal">ANIMES</span>
                </h2>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-full bg-secondary/50 p-2">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4 text-sm font-medium">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-secondary/20 p-3 hover:bg-secondary">Inicio</Link>
                <Link to="/animes" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-secondary/20 p-3 hover:bg-secondary">Catalogo Completo</Link>
                <Link to="/calendario" onClick={() => setMobileMenuOpen(false)} className="flex gap-2 rounded-lg bg-secondary/20 p-3 hover:bg-secondary">
                  <Calendar size={18} /> Calendario
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleFavoritesClick(); }}
                  className="flex gap-2 rounded-lg bg-secondary/20 p-3 text-left hover:bg-secondary"
                >
                  <Bookmark size={18} className={favorites.size > 0 && user ? "text-primary" : ""} />
                  Favoritos {favorites.size > 0 && user && `(${favorites.size})`}
                </button>

                <div className="mt-2 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-bold uppercase text-muted-foreground opacity-70">Animes</p>
                  {animesSubLinks.map(link => (
                    <button
                      key={link.category}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        const langParam = link.category === "legendados" ? "Legendado" : "Dublado";
                        navigate(`/animes?lang=${langParam}`);
                      }}
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/50"
                    >
                      <link.icon size={16} className="text-primary" />
                      {link.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-bold uppercase text-muted-foreground opacity-70">Filmes</p>
                  {filmesSubLinks.map(link => (
                    <button
                      key={link.category}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        const langParam = link.category === "filmes-legendados" ? "Legendado" : "Dublado";
                        navigate(`/animes?type=Filme&lang=${langParam}`);
                      }}
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/50"
                    >
                      <link.icon size={16} className="text-primary" />
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* modal de autenticação */}
      <AuthModal
        open={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};

export default Navbar;

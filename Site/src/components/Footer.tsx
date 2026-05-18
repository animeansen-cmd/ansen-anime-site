import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { animesQueryOptions, getLanguageLabel } from "@/services/api";

const Footer = () => {
  const { data: animes } = useQuery(animesQueryOptions);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pega animes reais do catalogo para popular as colunas
  const emAlta = (animes || [])
    .filter((a) => a.episodes.length > 5)
    .slice(0, 6);

  const dublados = (animes || [])
    .filter((a) => getLanguageLabel(a) === "Dublado")
    .slice(0, 6);

  return (
    <footer className="mt-8 md:mt-20 border-t border-border bg-[#0B0B0C] py-12 pb-6">
      <div className="container">
        {/* Top Section */}
        <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
          {/* Logo & Desc */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <h2 className="font-heading text-2xl font-black tracking-tight">
                <span className="text-gradient">ANSEN</span>{" "}
                <span className="rounded-sm bg-primary px-2 py-0.5 text-sm text-primary-foreground">ANIMES</span>
              </h2>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Assistir animes online no Ansen Animes é a melhor maneira de
              assistir animes grátis, basta dar play e ver seus animes
              favoritos em FHD, atualizados diariamente. Contamos com um acervo
              grande de animes e desenhos incluindo as melhores temporadas e
              mais...
            </p>
          </div>

          {/* Links 1 - Animes Em Alta (dados reais) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Animes Em Alta</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {emAlta.map((anime) => (
                <li key={anime.slug}>
                  <Link to={`/anime/${anime.slug}`} className="hover:text-primary transition-colors">
                    {anime.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links 2 - Animes Dublados (dados reais) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Animes Dublados</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {dublados.map((anime) => (
                <li key={anime.slug}>
                  <Link to={`/anime/${anime.slug}`} className="hover:text-primary transition-colors">
                    {anime.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 flex flex-wrap items-center justify-between border-t border-border/50 pt-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              AnsenAnimes - Assistir Animes Online Grátis
            </p>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground/70">
              <Link to="/politica-de-privacidade" className="hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>

          <button
            onClick={scrollToTop}
            className="mt-4 rounded bg-white/5 p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white sm:mt-0"
            title="Voltar ao topo"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

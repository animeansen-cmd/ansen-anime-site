import { Bookmark, Calendar, Clapperboard, Home, PlaySquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { dispatchAuthModal } from "@/lib/authModal";

const navItems = [
  { label: "Inicio", path: "/", icon: Home, match: (pathname: string) => pathname === "/" },
  { label: "Catalogo", path: "/animes", icon: Clapperboard, match: (pathname: string) => pathname.startsWith("/animes") || pathname.startsWith("/anime/") },
  { label: "Episodios", path: "/episodios", icon: PlaySquare, match: (pathname: string) => pathname.startsWith("/episodios") || pathname.startsWith("/episodio/") },
  { label: "Calendario", path: "/calendario", icon: Calendar, match: (pathname: string) => pathname.startsWith("/calendario") },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites } = useFavorites();

  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  const pathname = location.pathname;
  const favoritesActive = pathname.startsWith("/favoritos");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between rounded-[28px] border border-white/10 bg-background/90 px-2 py-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {navItems.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] px-1.5 py-2 text-[9px] font-semibold uppercase tracking-[0.04em] transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(255,102,38,0.3)]"
                  : "text-muted-foreground"
              }`}
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => {
            if (!user) {
              dispatchAuthModal("register");
              return;
            }
            navigate("/favoritos");
          }}
          className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] px-1.5 py-2 text-[9px] font-semibold uppercase tracking-[0.04em] transition-all ${
            favoritesActive
              ? "bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(255,102,38,0.3)]"
              : "text-muted-foreground"
          }`}
        >
          <Bookmark size={18} className={favoritesActive ? "fill-current" : user && favorites.size > 0 ? "fill-primary text-primary" : ""} />
          <span className="truncate">Favoritos</span>
          {user && favorites.size > 0 && (
            <span className={`absolute right-4 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black ${
              favoritesActive ? "bg-background/20 text-white" : "bg-primary text-primary-foreground"
            }`}>
              {favorites.size > 99 ? "99+" : favorites.size}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

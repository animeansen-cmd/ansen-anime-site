// Site/src/pages/FavoritosPage.tsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Heart, Loader2, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useSeo } from "@/hooks/useSeo";
import type { FavoriteRow } from "@/lib/supabase";

export default function FavoritosPage() {
    const { user, loading: authLoading } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
    const [loading, setLoading] = useState(true);

    useSeo({
        title: "Meus Favoritos | Ansen Animes",
        description: "Veja todos os animes que voce salvou como favorito no Ansen Animes.",
        canonical: "/favoritos",
    });

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        supabase
            .from("favorites")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
                setFavorites((data as FavoriteRow[]) || []);
                setLoading(false);
            });
    }, [user]);

    const removeFavorite = async (slug: string) => {
        if (!user) return;
        setFavorites(prev => prev.filter(f => f.anime_slug !== slug));
        await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("anime_slug", slug);
    };

    // carregando auth
    if (authLoading) {
        return (
            <div className="container flex min-h-[60vh] items-center justify-center py-24">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    // não logado
    if (!user) {
        return (
            <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-6 py-24 text-center">
                <div className="rounded-full bg-primary/10 p-6">
                    <Bookmark size={48} className="text-primary" />
                </div>
                <div>
                    <h1 className="font-heading text-2xl font-black">Seus favoritos</h1>
                    <p className="mt-2 text-muted-foreground">Faça login para salvar e acessar seus animes favoritos.</p>
                </div>
                <Link
                    to="/"
                    className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
                >
                    <LogIn size={16} />
                    Fazer login
                </Link>
            </div>
        );
    }

    // logado mas carregando
    if (loading) {
        return (
            <div className="container flex min-h-[60vh] items-center justify-center py-24">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    // sem favoritos
    if (!favorites.length) {
        return (
            <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-6 py-24 text-center">
                <div className="rounded-full bg-primary/10 p-6">
                    <Heart size={48} className="text-primary" />
                </div>
                <div>
                    <h1 className="font-heading text-2xl font-black">Nenhum favorito ainda</h1>
                    <p className="mt-2 text-muted-foreground">
                        Clique no ícone de favorito em qualquer anime para salvar aqui.
                    </p>
                </div>
                <Link
                    to="/animes"
                    className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
                >
                    Explorar animes
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-24 pb-20 md:pb-8">
            <div className="mb-8 flex items-center justify-between gap-4">
                <h1 className="flex items-center gap-3 font-heading text-3xl font-black">
                    <Bookmark size={28} className="text-primary" />
                    Meus Favoritos
                </h1>
                <span className="text-sm text-muted-foreground">{favorites.length} animes</span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {favorites.map(fav => (
                    <div key={fav.anime_slug} className="group relative">
                        <Link to={`/anime/${fav.anime_slug}`} className="block">
                            <div className="relative overflow-hidden rounded-2xl">
                                <img referrerPolicy="no-referrer"
                                    src={fav.anime_cover}
                                    alt={fav.anime_title}
                                    className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-snug">
                                {fav.anime_title}
                            </p>
                        </Link>

                        {/* botão remover */}
                        <button
                            onClick={() => removeFavorite(fav.anime_slug)}
                            className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-red-400 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-red-500/20"
                            title="Remover dos favoritos"
                        >
                            <Bookmark size={14} className="fill-current" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
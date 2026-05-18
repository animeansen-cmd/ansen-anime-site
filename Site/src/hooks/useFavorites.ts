// Site/src/hooks/useFavorites.ts

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Anime } from "@/types/anime";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("favorites")
      .select("anime_slug")
      .eq("user_id", user.id);

    setFavorites(new Set((data || []).map((row) => row.anime_slug)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = (slug: string) => favorites.has(slug);

  const toggleFavorite = async (anime: Pick<Anime, "slug" | "title" | "cover">) => {
    if (!user) return false;

    const already = favorites.has(anime.slug);
    const previousFavorites = new Set(favorites);

    setFavorites((current) => {
      const next = new Set(current);
      if (already) {
        next.delete(anime.slug);
      } else {
        next.add(anime.slug);
      }
      return next;
    });

    try {
      if (already) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("anime_slug", anime.slug);

        if (error) throw error;

        toast.success("Removido dos favoritos", {
          description: anime.title,
        });
      } else {
        const { error } = await supabase
          .from("favorites")
          .upsert({
            user_id: user.id,
            anime_slug: anime.slug,
            anime_title: anime.title,
            anime_cover: anime.cover || "",
          });

        if (error) throw error;

        toast.success("Adicionado aos favoritos", {
          description: anime.title,
        });
      }
    } catch (error) {
      setFavorites(previousFavorites);
      toast.error("Nao foi possivel atualizar seus favoritos", {
        description: error instanceof Error ? error.message : anime.title,
      });
      return false;
    }

    return true;
  };

  return { favorites, isFavorite, toggleFavorite, loading, reload: loadFavorites };
}

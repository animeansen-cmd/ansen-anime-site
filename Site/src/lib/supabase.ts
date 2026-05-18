// Site/src/lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://siswvybcbdxopljwzyrh.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpc3d2eWJjYmR4b3Bsand6eXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Nzg1MDQsImV4cCI6MjA5MjU1NDUwNH0.sIp9yuF4ztliB1TGrIgY7hOMZt9bKvk7zEVMSAttMpw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export type FavoriteRow = {
    id: string;
    user_id: string;
    anime_slug: string;
    anime_title: string;
    anime_cover: string;
    created_at: string;
};

export type SiteSettings = {
    id: string;
    calendar_config: Record<string, string[]>;
    status_map: Record<string, "LANCAMENTO" | "COMPLETO">;
};

export type EpisodeComment = {
    id: string;
    anime_slug: string;
    episode_number: string;
    user_id?: string;
    author_name: string;
    author_avatar: string;
    content: string;
    created_at: string;
};
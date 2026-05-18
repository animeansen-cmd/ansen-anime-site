-- 1. Cria a tabela de visualizações
CREATE TABLE IF NOT EXISTS episode_views (
    id SERIAL PRIMARY KEY,
    anime_slug TEXT NOT NULL,
    episode_number TEXT NOT NULL,
    views_count BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(anime_slug, episode_number)
);

-- 2. Cria a função segura para incrementar visualizações (RPC)
CREATE OR REPLACE FUNCTION increment_episode_view(p_anime_slug TEXT, p_episode_number TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_views_count BIGINT;
BEGIN
    INSERT INTO episode_views (anime_slug, episode_number, views_count)
    VALUES (p_anime_slug, p_episode_number, 1)
    ON CONFLICT (anime_slug, episode_number)
    DO UPDATE SET 
        views_count = episode_views.views_count + 1,
        updated_at = timezone('utc'::text, now())
    RETURNING views_count INTO new_views_count;
    
    RETURN new_views_count;
END;
$$;

-- 3. Habilita o envio de eventos Realtime para esta tabela
-- IMPORTANTE para atualizar o contador ao vivo na tela dos usuários
ALTER PUBLICATION supabase_realtime ADD TABLE episode_views;

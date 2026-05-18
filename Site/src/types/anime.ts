export interface VideoSource {
  url: string;
  type: string;
  label?: string;
}

export interface VideoData {
  main: string | null;
  players?: VideoSource[];
}

export interface AnimeEpisode {
  number: number;
  title: string;
  url: string;
  thumbnail: string;
  video: string | VideoData | null;
  createdAt?: string;
}

export interface Anime {
  id: string;
  title: string;
  slug: string;
  url: string;
  altTitle?: string;
  aliases?: string[];
  image: string;
  cover: string;
  coverFallback?: string;
  banner?: string;
  banners: string[];
  description?: string;
  synopsis: string;
  wpTags?: string[];
  genres: string[];
  year: string;
  createdAt?: string;
  releaseDate: string;
  rating: string | number;
  episodes: AnimeEpisode[];
  type?: string;
  video?: string | VideoData | null;
}

export interface CatalogEpisode extends AnimeEpisode {
  animeId: string;
  animeSlug: string;
  animeTitle: string;
  cover: string;
  banner: string;
  language: string;
  releaseDate: string;
  rating: number;
}

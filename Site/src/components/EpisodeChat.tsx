import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, MessageSquare, Pencil, Send, UserPlus, UserRound, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { dispatchAuthModal } from "@/lib/authModal";
import { episodeCommentsQueryOptions, postEpisodeComment } from "@/services/api";

interface EpisodeChatProps {
  animeSlug: string;
  episodeNumber: string;
}

interface AnonIdentity {
  name: string;
  avatar: string;
}

const STORAGE_KEY = "ansen_anon_identity";

function loadAnonIdentity(): AnonIdentity {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  const id = Math.floor(Math.random() * 9000) + 1000;
  const identity: AnonIdentity = {
    name: `Otaku_${id}`,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

function saveAnonName(name: string) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const current: AnonIdentity = stored ? JSON.parse(stored) : loadAnonIdentity();
    const updated = { ...current, name: name.trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {}
  return loadAnonIdentity();
}

export default function EpisodeChat({ animeSlug, episodeNumber }: EpisodeChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [anonIdentity, setAnonIdentity] = useState<AnonIdentity>(loadAnonIdentity);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isMovieChat = episodeNumber === "filme";

  const { data: comments = [], isLoading } = useQuery(
    episodeCommentsQueryOptions(animeSlug, episodeNumber),
  );

  const mutation = useMutation({
    mutationFn: postEpisodeComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", animeSlug, episodeNumber] });
      setContent("");
      setTimeout(() => scrollToBottom("smooth"), 100);
    },
  });

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }

  useEffect(() => {
    scrollToBottom();
  }, [comments.length]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editingName]);

  const openNameEdit = () => {
    setNameInput(anonIdentity.name);
    setEditingName(true);
  };

  const confirmNameEdit = () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) return;
    const updated = saveAnonName(trimmed);
    setAnonIdentity(updated);
    setEditingName(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    let author_name: string;
    let author_avatar: string;
    let user_id: string | undefined;

    if (user) {
      author_name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
      author_avatar =
        user.user_metadata?.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${author_name}`;
      user_id = user.id;
    } else {
      author_name = anonIdentity.name;
      author_avatar = anonIdentity.avatar;
    }

    mutation.mutate({
      anime_slug: animeSlug,
      episode_number: episodeNumber,
      author_name,
      author_avatar,
      content: content.trim(),
      user_id,
    });
  };

  const displayName = user
    ? user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario"
    : anonIdentity.name;

  const displayAvatar = user
    ? user.user_metadata?.avatar_url ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`
    : anonIdentity.avatar;

  return (
    <div className="flex h-[480px] w-full flex-col overflow-hidden rounded-3xl border border-white/8 bg-[#0A0A0F] shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:h-[540px]">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
          <MessageSquare size={15} className="text-primary" />
        </div>
        <h3 className="font-heading text-base font-bold text-white">
          {isMovieChat ? "Chat do Filme" : "Chat do Episódio"}
        </h3>
        <span className="ml-auto rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
          {comments.length}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-5"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageSquare size={40} className="text-white/10" />
            <p className="text-sm font-semibold text-white/40">Nenhum comentário ainda.</p>
            <p className="text-xs text-white/25">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img
                referrerPolicy="no-referrer"
                src={comment.author_avatar}
                alt={comment.author_name}
                className="h-8 w-8 flex-shrink-0 rounded-full border border-white/10 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={`text-sm font-bold ${comment.user_id ? "text-primary" : "text-white/80"}`}>
                    {comment.author_name}
                    {comment.user_id && (
                      <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                        membro
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-white/30">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="mt-1 break-words text-sm leading-relaxed text-white/75">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-white/8 bg-black/20 p-3 sm:p-4">

        {/* Identidade do usuário */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              referrerPolicy="no-referrer"
              src={displayAvatar}
              alt={displayName}
              className="h-7 w-7 flex-shrink-0 rounded-full border border-white/10 object-cover"
            />

            {editingName ? (
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <input
                  ref={nameInputRef}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmNameEdit();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  maxLength={24}
                  placeholder="Seu apelido..."
                  className="min-w-0 flex-1 rounded-lg border border-primary/40 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={confirmNameEdit}
                  className="flex-shrink-0 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="flex-shrink-0 text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-1.5">
                <span className={`truncate text-xs font-bold ${user ? "text-primary" : "text-white/70"}`}>
                  {displayName}
                </span>
                {!user && (
                  <button
                    type="button"
                    onClick={openNameEdit}
                    title="Editar apelido"
                    className="flex-shrink-0 text-white/30 transition-colors hover:text-white/70"
                  >
                    <Pencil size={11} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Botões de conta — só para visitantes */}
          {!user && (
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => dispatchAuthModal("login")}
                className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/60 transition-colors hover:border-primary/40 hover:text-primary"
              >
                <LogIn size={11} />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => dispatchAuthModal("register")}
                className="flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-primary"
              >
                <UserPlus size={11} />
                Criar conta
              </button>
            </div>
          )}

          {user && (
            <span className="flex-shrink-0 flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              <UserRound size={11} />
              Logado
            </span>
          )}
        </div>

        {/* Textarea + enviar */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isMovieChat ? "O que achou do filme?..." : "O que achou do episódio?..."}
            className="custom-scrollbar max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-primary/50 focus:bg-white/8 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!content.trim() || mutation.isPending}
            className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary"
          >
            <Send size={17} className={mutation.isPending ? "animate-pulse" : ""} />
          </button>
        </form>
      </div>
    </div>
  );
}

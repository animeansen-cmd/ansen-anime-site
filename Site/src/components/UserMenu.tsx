// Site/src/components/UserMenu.tsx

import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserMenuProps {
    onLoginClick: () => void;
}

export default function UserMenu({ onLoginClick }: UserMenuProps) {
    const { user, signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // não logado — abre o AuthModal
    if (!user) {
        return (
            <button
                onClick={onLoginClick}
                className="text-muted-foreground transition-colors hover:text-foreground"
                title="Entrar"
            >
                <User size={20} />
            </button>
        );
    }

    // logado — mostra avatar ou inicial
    const avatar = user.user_metadata?.avatar_url as string | undefined;
    const initial = (user.email ?? "U")[0].toUpperCase();

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-primary/10 text-sm font-bold text-primary transition-colors hover:border-primary"
                title="Meu perfil"
            >
                {avatar
                    ? <img referrerPolicy="no-referrer" src={avatar} alt="avatar" className="h-full w-full object-cover" />
                    : initial
                }
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-[70] mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
                    >
                        {/* info do usuário */}
                        <div className="border-b border-border px-4 py-3">
                            <p className="text-xs font-bold text-foreground truncate">{user.user_metadata?.full_name ?? "Usuário"}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        </div>

                        <Link
                            to="/favoritos"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                        >
                            <Bookmark size={15} className="text-primary" />
                            Meus Favoritos
                        </Link>

                        <button
                            onClick={() => { setOpen(false); signOut(); }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                            <LogOut size={15} />
                            Sair
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
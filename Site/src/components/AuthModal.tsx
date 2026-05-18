// Site/src/components/AuthModal.tsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { AuthModalMode } from "@/lib/authModal";

interface AuthModalProps {
    open: boolean;
    onClose: () => void;
    initialMode?: AuthModalMode;
}

export default function AuthModal({ open, onClose, initialMode = "login" }: AuthModalProps) {
    const [mode, setMode] = useState<AuthModalMode>(initialMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const reset = () => {
        setEmail(""); setPassword(""); setMsg(null); setLoading(false); setShowPass(false);
    };

    const switchMode = (m: AuthModalMode) => { reset(); setMode(m); };

    useEffect(() => {
        if (!open) return;
        setEmail("");
        setPassword("");
        setMsg(null);
        setLoading(false);
        setShowPass(false);
        setMode(initialMode);
    }, [open, initialMode]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        if (mode === "login") {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setMsg({ type: "err", text: "Email ou senha incorretos." });
            else { onClose(); reset(); }

        } else if (mode === "register") {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) setMsg({ type: "err", text: error.message });
            else setMsg({ type: "ok", text: "Confirma teu email para ativar a conta!" });

        } else {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) setMsg({ type: "err", text: error.message });
            else setMsg({ type: "ok", text: "Email de recuperação enviado!" });
        }

        setLoading(false);
    }

    async function loginWithGoogle() {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.href },
        });
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* overlay */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm"
                    />

                    {/* modal wrapper para centralizar e adicionar padding mobile */}
                    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
                        <motion.div
                            onClick={e => e.stopPropagation()} // impede fechar ao clicar no formulário
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 shadow-2xl"
                        >
                        {/* header */}
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="font-heading text-xl font-black">
                                {mode === "login" && "Entrar"}
                                {mode === "register" && "Criar conta"}
                                {mode === "reset" && "Recuperar senha"}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Google */}
                        {mode !== "reset" && (
                            <button
                                onClick={loginWithGoogle}
                                className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-border py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continuar com Google
                            </button>
                        )}

                        {mode !== "reset" && (
                            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
                            </div>
                        )}

                        {/* form */}
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="email" required value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="w-full rounded-xl border border-border bg-secondary/30 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
                                />
                            </div>

                            {mode !== "reset" && (
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type={showPass ? "text" : "password"} required value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Senha"
                                        className="w-full rounded-xl border border-border bg-secondary/30 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-primary"
                                    />
                                    <button type="button" onClick={() => setShowPass(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            )}

                            {msg && (
                                <p className={`rounded-lg px-3 py-2 text-xs ${msg.type === "ok" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                    {msg.text}
                                </p>
                            )}

                            <button
                                type="submit" disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                            >
                                {loading && <Loader2 size={15} className="animate-spin" />}
                                {mode === "login" && "Entrar"}
                                {mode === "register" && "Criar conta"}
                                {mode === "reset" && "Enviar email"}
                            </button>
                        </form>

                        {/* links de troca de modo */}
                        <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
                            {mode === "login" && <>
                                <button onClick={() => switchMode("reset")} className="block w-full hover:text-foreground">
                                    Esqueci minha senha
                                </button>
                                <button onClick={() => switchMode("register")} className="block w-full hover:text-foreground">
                                    Não tem conta? <span className="font-semibold text-primary">Criar agora</span>
                                </button>
                            </>}
                            {mode === "register" && (
                                <button onClick={() => switchMode("login")} className="hover:text-foreground">
                                    Já tem conta? <span className="font-semibold text-primary">Entrar</span>
                                </button>
                            )}
                            {mode === "reset" && (
                                <button onClick={() => switchMode("login")} className="hover:text-foreground">
                                    Voltar para login
                                </button>
                            )}
                        </div>
                    </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

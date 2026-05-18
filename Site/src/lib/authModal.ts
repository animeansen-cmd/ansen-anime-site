export type AuthModalMode = "login" | "register" | "reset";

export const AUTH_MODAL_EVENT = "openAuthModal";

export function dispatchAuthModal(mode: AuthModalMode = "login") {
  window.dispatchEvent(new CustomEvent(AUTH_MODAL_EVENT, { detail: { mode } }));
}

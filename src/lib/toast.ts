export type ToastKind = 'success' | 'error';

// Window events instead of a shared module store: client components imported
// separately from the server layout can get duplicated module instances in
// dev (Turbopack), which silently breaks a zustand-based toast bus.
const TOAST_EVENT = 'finclear:toast';

export function showToast(message: string, kind: ToastKind = 'error') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, kind } }));
}

export function onToast(handler: (toast: { message: string; kind: ToastKind }) => void) {
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener(TOAST_EVENT, listener);
  return () => window.removeEventListener(TOAST_EVENT, listener);
}

// For .catch() on background cloud writes: logs the real error and surfaces
// a visible notice instead of failing silently.
export const reportSyncError = (context: string) => (err: unknown) => {
  console.error(`Cloud sync failed (${context}):`, err);
  showToast(`Cloud sync failed — your ${context} is saved on this device only.`, 'error');
};

// Survives a window.location.reload() (e.g. after a backup import).
const PENDING_KEY = 'finclear_pending_toast';

export function queueToastAfterReload(message: string, kind: ToastKind) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ message, kind }));
  } catch {
    // sessionStorage unavailable — the toast is lost, nothing else breaks
  }
}

export function takePendingToast(): { message: string; kind: ToastKind } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

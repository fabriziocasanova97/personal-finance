"use client";

import { useEffect, useState } from "react";
import { onToast, takePendingToast, ToastKind } from "@/lib/toast";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export function Toast() {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);

  useEffect(() => {
    // Pick up a notice queued right before a page reload (backup import flow)
    const pending = takePendingToast();
    if (pending) setToast(pending);
    return onToast(setToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.kind === "error" ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const isError = toast.kind === "error";

  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 max-w-sm rounded-sm border p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isError ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
      }`}
    >
      {isError ? (
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
      ) : (
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
      )}
      <p className="text-sm leading-snug">{toast.message}</p>
      <button
        onClick={() => setToast(null)}
        aria-label="Dismiss"
        className={`shrink-0 rounded-sm p-0.5 transition-colors ${
          isError ? "hover:bg-red-100 text-red-400" : "hover:bg-green-100 text-green-500"
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

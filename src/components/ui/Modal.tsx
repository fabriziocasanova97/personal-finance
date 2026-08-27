"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/** Bottom sheet on mobile, centered dialog from `sm:` up. Body scrolls; header stays. */
export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-50 flex w-full max-h-[90dvh] flex-col bg-white shadow-lg",
          "rounded-t-lg sm:rounded-sm sm:max-w-lg",
          className
        )}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:px-6 sm:pt-6 border-b border-gray-100">
          <h2 id="modal-title" className="text-lg font-heading font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5 pb-safe">
          <div className="pb-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

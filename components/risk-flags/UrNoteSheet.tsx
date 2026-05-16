"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

type State = "idle" | "generating" | "done" | "error";

type Props = {
  patientId: string;
  open: boolean;
  onClose: () => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function SlideOver({
  open,
  onClose,
  titleId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Track what had focus before opening so we can restore it on close
  const priorFocusRef = useRef<Element | null>(null);

  // Capture prior focus and auto-focus first element on open
  useEffect(() => {
    if (open) {
      priorFocusRef.current = document.activeElement;
      // Defer so the portal is painted before we focus into it
      const id = setTimeout(() => {
        const first = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
        first?.focus();
      }, 0);
      return () => clearTimeout(id);
    } else {
      // Restore focus to the element that triggered open
      if (priorFocusRef.current instanceof HTMLElement) {
        priorFocusRef.current.focus();
      }
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap: keep Tab cycling inside the panel
  useEffect(() => {
    if (!open) return;
    function onTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => !el.closest("[aria-hidden='true']"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop — hidden from AT; click to dismiss */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-background shadow-xl"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function UrNoteSheet({ patientId, open, onClose }: Props) {
  const titleId = useId();
  const [state, setState] = useState<State>("idle");
  const [text, setText] = useState("");

  const patientShort = patientId.slice(0, 12);

  async function generate() {
    setState("generating");
    setText("");

    try {
      const res = await fetch("/api/ur-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });

      if (!res.ok || !res.body) {
        setState("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            setState("done");
            return;
          }
          try {
            const { text: token } = JSON.parse(payload) as { text: string };
            setText((prev) => prev + token);
          } catch {
            // ignore malformed chunks
          }
        }
      }

      setState("done");
    } catch {
      setState("error");
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(text);
  }

  return (
    <SlideOver open={open} onClose={onClose} titleId={titleId}>
      {/* Header */}
      <div className="flex items-start justify-between border-b px-6 py-4">
        <div className="space-y-0.5">
          <h2 id={titleId} className="text-base font-semibold leading-none">
            Draft UR Note · {patientShort}
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-drafted clinical justification for the payor
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {state === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generates a structured clinical justification note using this patient&apos;s
              de-identified census and risk flag data.
            </p>
            <Button onClick={generate} size="sm">
              Generate Draft
            </Button>
          </div>
        )}

        {state === "generating" && text === "" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span aria-live="polite">Generating UR note…</span>
          </div>
        )}

        {(state === "generating" || state === "done") && text !== "" && (
          <div className="space-y-3">
            <pre
              aria-live="polite"
              aria-label="Generated UR note"
              className="rounded-md border bg-muted/30 p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono"
            >
              {text}
              {state === "generating" && (
                <span aria-hidden="true" className="inline-block h-3 w-0.5 bg-foreground animate-pulse ml-0.5" />
              )}
            </pre>

            {state === "done" && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  Copy to clipboard
                </Button>
                <Button size="sm" variant="ghost" onClick={generate}>
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        )}

        {state === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground" role="alert">
              Failed to generate note. Check that AWS credentials are configured.
            </p>
            <Button size="sm" variant="ghost" onClick={generate}>
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-3">
        <p className="text-xs text-muted-foreground">
          Synthetic data only · Generated by Claude Sonnet 4.5 on AWS Bedrock
        </p>
      </div>
    </SlideOver>
  );
}

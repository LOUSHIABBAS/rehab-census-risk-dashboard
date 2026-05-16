"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type State = "idle" | "generating" | "done" | "error";

export function DailyBriefingCard() {
  const [state, setState] = useState<State>("idle");
  const [text, setText] = useState("");
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  async function generate() {
    setState("generating");
    setText("");

    try {
      const res = await fetch("/api/briefing", { method: "POST" });

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
            setGeneratedAt(new Date());
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
      setGeneratedAt(new Date());
    } catch {
      setState("error");
    }
  }

  const bullets = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("•"));

  return (
    <Card className="border-l-[6px] border-l-teal-600 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Daily Operations Briefing</CardTitle>
        <p className="text-xs text-muted-foreground">
          AI-generated summary for facility leadership · powered by Claude Sonnet 4.5 on AWS
          Bedrock
        </p>
      </CardHeader>

      <CardContent>
        {state === "idle" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {[
                "Identifies facilities operating over capacity and the actions needed",
                "Surfaces authorization lapses and payor coordination priorities",
                "Highlights high-severity clinical flags requiring case manager attention",
              ].map((preview, i) => (
                <p key={i} className="text-sm text-slate-400 dark:text-slate-600 leading-relaxed">
                  • {preview}
                </p>
              ))}
            </div>
            <Button
              onClick={generate}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium"
            >
              Generate today&apos;s briefing
            </Button>
          </div>
        )}

        {state === "generating" && (
          <div className="space-y-3">
            {text === "" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating briefing…
              </div>
            ) : (
              <div className="space-y-1.5">
                {text
                  .split("\n")
                  .map((l) => l.trim())
                  .filter((l) => l.startsWith("•"))
                  .map((bullet, i) => (
                    <p key={i} className="text-sm leading-relaxed">
                      {bullet}
                    </p>
                  ))}
                <span className="inline-block h-4 w-0.5 bg-foreground animate-pulse" />
              </div>
            )}
          </div>
        )}

        {state === "done" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {bullets.map((bullet, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  {bullet}
                </p>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Generated{" "}
                {generatedAt?.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <Button variant="ghost" size="sm" onClick={generate} className="text-xs h-7">
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Failed to generate briefing. Check that AWS credentials are configured.
            </p>
            <Button variant="ghost" size="sm" onClick={generate}>
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

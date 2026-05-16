export function DemoBanner() {
  return (
    <div className="w-full border-b bg-muted/50 py-2 px-4 text-center text-xs text-muted-foreground">
      Live demo built with Claude Code · Synthetic data only ·{" "}
      <a
        href="https://github.com/LOUSHIABBAS/rehab-census-risk-dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-foreground transition-colors"
      >
        GitHub source ↗
      </a>
    </div>
  );
}

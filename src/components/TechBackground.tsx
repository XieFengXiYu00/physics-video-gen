/**
 * Layered animated tech background:
 *   1. Radial cyan/violet glows that slowly drift
 *   2. Static perspective grid (CSS gradient)
 *   3. Slow horizontal scan line (CSS animation)
 *
 * Pure CSS / pointer-events:none so it never blocks interactions.
 */
export function TechBackground() {
  return (
    <div className="tech-bg" aria-hidden>
      <div className="tech-bg-grid" />
      <div className="tech-bg-glow tech-bg-glow-1" />
      <div className="tech-bg-glow tech-bg-glow-2" />
      <div className="tech-bg-scan" />
      <div className="tech-bg-vignette" />
    </div>
  );
}

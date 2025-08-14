export function Badge({ tone="good", children }) {
  const toneClass = tone === "good" ? "badge-good" : tone === "warn" ? "badge-warn" : "badge-bad";
  return <span className={`badge ${toneClass}`}>{children}</span>;
}

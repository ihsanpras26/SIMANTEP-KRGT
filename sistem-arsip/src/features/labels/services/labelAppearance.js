export const LABEL_COLORS = {
  rose: "#fb7185",
  pink: "#f472b6",
  fuchsia: "#e879f9",
  purple: "#c084fc",
  violet: "#a78bfa",
  indigo: "#a5b4fc",
  blue: "#60a5fa",
  sky: "#38bdf8",
  cyan: "#22d3ee",
  teal: "#2dd4bf",
  emerald: "#34d399",
  green: "#4ade80",
  lime: "#a3e635",
  yellow: "#facc15",
  amber: "#ffb829",
  orange: "#fb923c",
  red: "#f87171",
  slate: "#94a3b8",
  gray: "#9ca3af",
  zinc: "#a1a1aa",
  stone: "#a8a29e",
  neutral: "#bdbdbd",
};

export function resolveLabelColor(value) {
  if (typeof value !== "string") return LABEL_COLORS.neutral;
  const color = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(color)) return color;
  if (/^#[0-9a-f]{3}$/.test(color))
    return `#${[...color.slice(1)].map((c) => c + c).join("")}`;
  const name = color.match(
    /^(?:bg-|text-)?([a-z]+)(?:-(?:50|[1-9]00|950))?$/,
  )?.[1];
  return LABEL_COLORS[name] || LABEL_COLORS.neutral;
}

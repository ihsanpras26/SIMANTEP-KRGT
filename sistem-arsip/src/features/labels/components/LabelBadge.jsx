import {
  Tag,
  Star,
  Heart,
  Bookmark,
  Flag,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  FileText,
  Users,
  Briefcase,
  Archive,
  X,
} from "lucide-react";
import { resolveLabelColor } from "../services/labelAppearance";

const ICONS = {
  Tag,
  Star,
  Heart,
  Bookmark,
  Flag,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  FileText,
  Users,
  Briefcase,
  Archive,
};

export default function LabelBadge({
  label,
  className = "",
  size = "sm",
  showDelete = false,
  onDelete,
}) {
  if (!label) return null;
  const color = resolveLabelColor(label.color);
  const Icon = ICONS[label.icon] || Tag;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"} ${className}`}
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}12`,
        color: "var(--text-primary)",
      }}
    >
      <Icon
        aria-hidden="true"
        size={size === "sm" ? 12 : 15}
        className="shrink-0"
        style={{ color }}
      />
      <span className="truncate">{label.name || "Tanpa nama"}</span>
      {showDelete && (
        <button
          type="button"
          aria-label={`Lepas label ${label.name}`}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-[var(--hover)] focus-visible:outline-2"
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.(label);
          }}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

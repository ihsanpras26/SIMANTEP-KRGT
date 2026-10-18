import { LoaderCircle } from "lucide-react";

export default function RouteLoading({ message = "Memuat halaman…" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="empty-state flex min-h-64 items-center justify-center gap-3 p-6 text-[var(--text-muted)]"
    >
      <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

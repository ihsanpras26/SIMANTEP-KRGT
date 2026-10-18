export default function StatusBadge({ status }) {
  const active = status === "active";
  return (
    <span
      className={`status-pill inline-flex items-center gap-2 whitespace-nowrap text-xs ${active ? "status-active" : "status-inactive"}`}
    >
      {active ? "Aktif" : "Inaktif"}
    </span>
  );
}

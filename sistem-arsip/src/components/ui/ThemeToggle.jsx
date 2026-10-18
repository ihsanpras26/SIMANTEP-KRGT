import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { getTheme, setTheme, subscribeTheme } from "../../lib/theme";

export default function ThemeToggle({ showLabel = false }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "light");
  const dark = theme === "dark";
  const label = dark ? "Gunakan mode terang" : "Gunakan mode gelap";
  return (
    <button
      type="button"
      className={`theme-toggle ${showLabel ? "theme-toggle-label" : ""}`}
      aria-label={label}
      title={label}
      aria-pressed={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
      {showLabel && <span>{dark ? "Mode terang" : "Mode gelap"}</span>}
    </button>
  );
}

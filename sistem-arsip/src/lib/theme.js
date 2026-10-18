export const THEME_KEY = "simantep_theme";

export function readTheme(storage) {
  try {
    return storage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function getTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = value;
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    /* The choice still applies for this visit. */
  }
  window.dispatchEvent(new Event("simantep-theme-change"));
}

export function subscribeTheme(listener) {
  const sync = (event) => {
    if (event.key && event.key !== THEME_KEY) return;
    try {
      document.documentElement.dataset.theme = readTheme(localStorage);
    } catch {
      document.documentElement.dataset.theme = "light";
    }
    listener();
  };
  window.addEventListener("simantep-theme-change", listener);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener("simantep-theme-change", listener);
    window.removeEventListener("storage", sync);
  };
}

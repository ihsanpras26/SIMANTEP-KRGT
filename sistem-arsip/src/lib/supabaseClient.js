import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabasePublicKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    "",
).trim();

let supabase = null;
let configurationError = "";

try {
  const url = new URL(supabaseUrl);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    !supabasePublicKey ||
    /your_supabase|your_key_here/.test(`${supabaseUrl} ${supabasePublicKey}`)
  ) {
    throw new Error("Missing public configuration");
  }
  if (supabasePublicKey.startsWith("sb_secret_"))
    throw new Error("Secret keys cannot be used in a browser");
  if (supabasePublicKey.split(".").length === 3) {
    const payload = JSON.parse(
      atob(
        supabasePublicKey.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
      ),
    );
    if (payload.role === "service_role")
      throw new Error("Service role keys cannot be used in a browser");
  }
  supabase = createClient(supabaseUrl, supabasePublicKey);
} catch {
  configurationError =
    "Konfigurasi koneksi Supabase belum tersedia atau tidak valid.";
}

export { supabase, configurationError };

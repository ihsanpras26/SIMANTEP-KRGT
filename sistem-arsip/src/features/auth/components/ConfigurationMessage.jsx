import { Settings2 } from "lucide-react";

export default function ConfigurationMessage({ reason }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--canvas)] px-6 py-12 text-[var(--text-primary)]">
      <section
        className="max-w-lg space-y-6"
        aria-labelledby="configuration-heading"
      >
        <Settings2 size={36} strokeWidth={1.5} className="text-[#8052ff]" />
        <p className="page-eyebrow">SIMANTEP KRGT</p>
        <h1 id="configuration-heading" className="page-heading">
          Ruang kerja belum siap
        </h1>
        <p className="page-description">
          {reason || "Konfigurasi koneksi belum tersedia."} Hubungi pengelola
          aplikasi untuk menyelesaikan pengaturan.
        </p>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Setelah konfigurasi diperbarui, muat ulang halaman ini untuk masuk.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          Muat ulang
        </button>
      </section>
    </main>
  );
}

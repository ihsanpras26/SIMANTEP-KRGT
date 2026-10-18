import { ArrowUpRight } from "lucide-react";
import AdminLoginForm from "./AdminLoginForm";
import ThemeToggle from "../../../components/ui/ThemeToggle";
import photo from "../../../assets/krgt-login.webp";
import logo from "../../../assets/favicon.svg";

export default function LoginPage({ onSubmit, error }) {
  return (
    <main className="login-page">
      <section
        className="login-visual"
        aria-label="SIMANTEP Kebun Raya Gunung Tidar"
      >
        <img
          className="login-photo"
          src={photo}
          alt="Kebun Raya Gunung Tidar"
          width="1280"
          height="960"
          fetchPriority="high"
        />
        <div className="login-photo-shade" />
        <div className="login-brand">
          <img src={logo} alt="" width="34" height="34" />
          <span>SIMANTEP</span>
        </div>
        <div className="login-visual-copy">
          <h1>
            Arsip rapi.
            <br />
            Kerja lebih mudah.
          </h1>
          <p>Temukan surat saat Anda membutuhkannya.</p>
        </div>
        <div className="login-place">
          <span>
            Kebun Raya Gunung Tidar<small>Magelang, Jawa Tengah</small>
          </span>
          <ArrowUpRight size={22} aria-hidden="true" />
        </div>
      </section>
      <section className="login-panel" aria-labelledby="login-heading">
        <div className="login-toolbar">
          <ThemeToggle showLabel />
        </div>
        <div className="login-content">
          <div className="login-form-icon">
            <img src={logo} alt="" width="30" height="30" />
          </div>
          <h2 id="login-heading">Masuk ke SIMANTEP</h2>
          <p className="login-intro">Kelola surat dan arsip Anda di sini.</p>
          <AdminLoginForm onSubmit={onSubmit} sessionError={error} />
          <p className="login-help">Butuh akses? Hubungi pengelola SIMANTEP.</p>
        </div>
        <p className="login-footer">UPT Kebun Raya Gunung Tidar</p>
      </section>
    </main>
  );
}

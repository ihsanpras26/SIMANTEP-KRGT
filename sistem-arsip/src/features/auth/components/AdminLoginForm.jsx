import { useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

function loginMessage(error) {
  if (!error) return "";
  const message = error.message || "";
  if (
    error.code === "invalid_credentials" ||
    /invalid login credentials/i.test(message)
  )
    return "Email atau kata sandi tidak cocok. Coba lagi.";
  if (error.status === 429 || /rate limit|too many requests/i.test(message))
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  if (/fetch|network|connection/i.test(message))
    return "Tidak dapat terhubung. Periksa koneksi internet Anda.";
  return message || "Belum berhasil masuk. Coba lagi.";
}

export default function AdminLoginForm({ onSubmit, sessionError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(email, password);
    } catch (failure) {
      setError(loginMessage(failure));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };
  const message = error || loginMessage(sessionError);

  return (
    <form onSubmit={submit} className="login-form" aria-busy={loading}>
      <div>
        <label htmlFor="login-email" className="field-label">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          autoComplete="username"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
          placeholder="nama@instansi.go.id"
          required
          disabled={loading}
          className="field w-full"
          aria-describedby={message ? "login-error" : undefined}
        />
      </div>
      <div>
        <label htmlFor="login-password" className="field-label">
          Kata sandi
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            autoComplete="current-password"
            type={visible ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            placeholder="Masukkan kata sandi"
            required
            disabled={loading}
            className="field w-full pr-14"
            aria-describedby={message ? "login-error" : undefined}
          />
          <button
            type="button"
            className="icon-button absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => setVisible(!visible)}
            aria-label={
              visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      {message && (
        <p role="alert" id="login-error" className="dialog-error">
          {message}
        </p>
      )}
      <button
        type="submit"
        className="btn-primary w-full justify-center"
        disabled={loading}
      >
        {loading ? (
          <>
            <LoaderCircle size={18} className="animate-spin" />
            Masuk…
          </>
        ) : (
          <>
            Masuk
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}

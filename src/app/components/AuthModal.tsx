import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Eye, EyeOff, Mail, Lock, User, MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface Props {
  open: boolean;
  isDark: boolean;
  initialTab?: "login" | "register";
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
}


function InputField({
  label,
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  isDark,
  right,
}: {
  label: string;
  icon: React.ElementType;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isDark: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`text-sm ${isDark ? "text-neutral-300" : "text-neutral-700"}`}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <Icon
          className={`absolute left-3 w-4 h-4 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
            isDark
              ? "bg-neutral-800/70 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:border-[var(--app-accent)] focus:ring-[color:var(--app-accent)]/20"
              : "bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--app-accent)] focus:ring-[color:var(--app-accent)]/20"
          }`}
        />
        {right && (
          <div className="absolute right-3">{right}</div>
        )}
      </div>
    </div>
  );
}

export function AuthModal({ open, isDark, initialTab = "login", onClose, onLogin }: Props) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync tab when modal opens with a different initialTab
  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setError("");
    }
  }, [open, initialTab]);

  // Login fields
  const [lEmail, setLEmail] = useState("");
  const [lPassword, setLPassword] = useState("");

  // Register fields
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rConfirm, setRConfirm] = useState("");

  const reset = () => {
    setError("");
    setLEmail(""); setLPassword("");
    setRName(""); setREmail(""); setRPassword(""); setRConfirm("");
    setShowPw(false); setShowConfirm(false);
  };

  const switchTab = (t: "login" | "register") => {
    setTab(t);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Memanggil Supabase untuk mengecek email & password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: lEmail,
      password: lPassword,
    });

    if (error) {
      setError("Email atau kata sandi tidak sesuai.");
      setLoading(false);
      return;
    }

    if (data.user) {
      // data.user.user_metadata.full_name mengambil nama yang disimpan saat daftar
      onLogin({ 
        id: data.user.id, 
        name: data.user.user_metadata.full_name || "User", 
        email: data.user.email || "" 
      });
      reset();
      onClose();
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rPassword.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (rPassword !== rConfirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    // Mendaftarkan user baru ke database Supabase
    const { data, error } = await supabase.auth.signUp({
      email: rEmail,
      password: rPassword,
      options: {
        data: {
          full_name: rName, // Menyimpan nama ke metadata user
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      alert("Pendaftaran berhasil! Silakan cek email kamu untuk verifikasi.");
      onClose();
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Always redirect back to the current origin (dev stays dev, prod stays prod).
        redirectTo: `${window.location.origin}/map`
      }
    });
    if (error) setError(error.message);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[900] flex items-center justify-center p-4"
        >
          {/* Backdrop — click to close */}
          <div
            className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-black/60" : "bg-black/40"}`}
            onClick={() => { reset(); onClose(); }}
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${
              isDark
                ? "bg-neutral-900 border border-neutral-800"
                : "bg-white border border-neutral-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green glow top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--app-accent)]" />

            {/* Header */}
            <div className={`px-6 pt-6 pb-4 border-b ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--app-accent)] flex items-center justify-center shadow-md shadow-black/20">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className={`text-sm leading-none ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                      Jelajah Nusantara
                    </div>
                    <div className={`text-xs mt-0.5 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                      {tab === "login" ? "Masuk ke akunmu" : "Buat akun baru"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { reset(); onClose(); }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDark ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-neutral-100 text-neutral-500"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab switcher */}
              <div className={`flex p-1 rounded-full gap-1 ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`}>
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    className={`flex-1 py-2 rounded-full text-sm transition-all ${
                      tab === t
                        ? "bg-[var(--app-accent)] text-[var(--app-accent-fg)] shadow-md shadow-black/20"
                        : isDark
                          ? "text-neutral-400 hover:text-neutral-200"
                          : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    {t === "login" ? "Masuk" : "Daftar"}
                  </button>
                ))}
              </div>
            </div>

            {/* Forms */}
            <div className="px-6 py-5">
              {/* 1. Tombol Google di Paling Atas */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className={`w-full flex items-center justify-center gap-3 py-2.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] mb-4 ${
                  isDark 
                    ? "bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-750" 
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  className="w-5 h-5" 
                  alt="Google" 
                />
                <span className="text-sm font-medium">Lanjut dengan Google</span>
              </button>

              {/* 2. Garis Pemisah */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? "border-neutral-800" : "border-neutral-200"}`}></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className={`px-2 ${isDark ? "bg-neutral-900 text-neutral-500" : "bg-white text-neutral-400"}`}>
                    Atau gunakan email
                  </span>
                </div>
              </div>

              {/* 3. Animasi Form Login/Register */}
              <AnimatePresence mode="wait">
                {tab === "login" ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleLogin}
                    className="flex flex-col gap-4"
                  >
                    <InputField
                      label="Email"
                      icon={Mail}
                      type="email"
                      value={lEmail}
                      onChange={setLEmail}
                      placeholder="email@kamu.com"
                      isDark={isDark}
                    />
                    <InputField
                      label="Kata Sandi"
                      icon={Lock}
                      type={showPw ? "text" : "password"}
                      value={lPassword}
                      onChange={setLPassword}
                      placeholder="••••••••"
                      isDark={isDark}
                      right={
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className={`${isDark ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"} transition-colors`}
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl"
                      >
                        ⚠️ {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !lEmail || !lPassword}
                      className="mt-1 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    >
                      {loading ? "Memproses..." : "Masuk"}
                    </button>

                    <p className={`text-center text-xs ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                      Belum punya akun?{" "}
                      <button
                        type="button"
                        onClick={() => switchTab("register")}
                        className="text-[var(--app-accent)] hover:opacity-90 underline-offset-2 hover:underline"
                      >
                        Daftar sekarang
                      </button>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleRegister}
                    className="flex flex-col gap-4"
                  >
                    <InputField
                      label="Nama Lengkap"
                      icon={User}
                      type="text"
                      value={rName}
                      onChange={setRName}
                      placeholder="Nama kamu"
                      isDark={isDark}
                    />
                    <InputField
                      label="Email"
                      icon={Mail}
                      type="email"
                      value={rEmail}
                      onChange={setREmail}
                      placeholder="email@kamu.com"
                      isDark={isDark}
                    />
                    <InputField
                      label="Kata Sandi"
                      icon={Lock}
                      type={showPw ? "text" : "password"}
                      value={rPassword}
                      onChange={setRPassword}
                      placeholder="Min. 6 karakter"
                      isDark={isDark}
                      right={
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className={`${isDark ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"} transition-colors`}
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                    <InputField
                      label="Konfirmasi Kata Sandi"
                      icon={Lock}
                      type={showConfirm ? "text" : "password"}
                      value={rConfirm}
                      onChange={setRConfirm}
                      placeholder="Ulangi kata sandi"
                      isDark={isDark}
                      right={
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className={`${isDark ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"} transition-colors`}
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl"
                      >
                        ⚠️ {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !rName || !rEmail || !rPassword || !rConfirm}
                      className="mt-1 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] transition-all hover:opacity-95"
                    >
                      {loading ? "Mendaftar..." : "Buat Akun"}
                    </button>

                    <p className={`text-center text-xs ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                      Sudah punya akun?{" "}
                      <button
                        type="button"
                        onClick={() => switchTab("login")}
                        className="text-[var(--app-accent)] hover:opacity-90 underline-offset-2 hover:underline"
                      >
                        Masuk di sini
                      </button>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={`px-6 pb-5 text-center text-xs ${isDark ? "text-neutral-600" : "text-neutral-400"}`}>
            Akun kamu aman tersinkronisasi dengan Cloud ☁️
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

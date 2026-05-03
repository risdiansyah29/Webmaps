import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Bell, Moon, Sun } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { AuthModal, type AuthUser } from "../components/AuthModal";

type ThemeCtx = { isDark: boolean; toggle: () => void };
const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme() {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme must be used within AppShell");
  return v;
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/map")) return "Map";
  if (pathname.startsWith("/favorites")) return "Favorites";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/place/")) return "Details";
  return "Discover";
}

export default function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const t = localStorage.getItem("theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name,
          email: session.user.email ?? "",
        });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name,
          email: session.user.email ?? "",
        });
      } else {
        setCurrentUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const themeValue = useMemo(
    () => ({ isDark, toggle: () => setIsDark((v) => !v) }),
    [isDark],
  );

  const title = pageTitle(loc.pathname);

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className={isDark ? "dark" : ""}>
        <div className="min-h-screen w-screen bg-[var(--app-bg)] text-[var(--app-text)]">
          <header className="sticky top-0 z-[900] w-full border-b border-[var(--app-border)] bg-[color:var(--app-bg)]/90 backdrop-blur-md">
            <div className="mx-auto w-full max-w-[1280px] px-6 py-4 flex items-center gap-4">
              <div className="min-w-0">
                <div className="font-bold tracking-[-0.5px] truncate">{title}</div>
              </div>

              <nav className="hidden md:flex items-center gap-6 ml-auto">
                <button
                  onClick={() => nav("/discover")}
                  className="text-xs tracking-[0.6px] font-semibold text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
                >
                  Discover
                </button>
                <button
                  onClick={() => nav("/map")}
                  className="text-xs tracking-[0.6px] font-semibold text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
                >
                  Map
                </button>
                <button
                  onClick={() => nav("/favorites")}
                  className="text-xs tracking-[0.6px] font-semibold text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
                >
                  Favorites
                </button>
              </nav>

              <div className="flex items-center gap-3">
                <button
                  className="hidden md:flex w-10 h-10 rounded-full items-center justify-center bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsDark((v) => !v)}
                  className="w-10 h-10 rounded-full items-center justify-center bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text-muted)] hover:text-[var(--app-text)] flex"
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    if (!currentUser) setAuthOpen(true);
                    else nav("/profile");
                  }}
                  className="w-9 h-9 rounded-full bg-[var(--app-accent)] ring-2 ring-[var(--app-border)]"
                  aria-label="User profile"
                  title={currentUser ? currentUser.name : "Login"}
                />
              </div>
            </div>
          </header>

          <Outlet />

          <AuthModal
            open={authOpen}
            isDark={isDark}
            initialTab="login"
            onClose={() => setAuthOpen(false)}
            onLogin={(u) => {
              setCurrentUser(u);
              nav("/map");
            }}
          />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

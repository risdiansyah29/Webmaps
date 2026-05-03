import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Heart, Mail, MapPin, User } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import type { Place } from "../data/places";
import { AuthModal, type AuthUser } from "../components/AuthModal";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../layout/AppShell";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function ProfilePage() {
  const nav = useNavigate();
  const { isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const [items, setItems] = useState<Place[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const load = async () => {
      if (!currentUser) {
        setItems([]);
        setFavoriteIds(new Set());
        return;
      }
      const { data } = await supabase
        .from("favorites")
        .select("location_id")
        .eq("user_id", currentUser.id);
      const ids = (data ?? []).map((x: any) => x.location_id).filter(Boolean);
      const idSet = new Set<string>(ids);
      setFavoriteIds(idSet);
      if (!ids.length) {
        setItems([]);
        return;
      }
      const { data: locs } = await supabase.from("locations").select("*").in("id", ids);
      setItems((locs as any) ?? []);
    };
    load();
  }, [currentUser]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [items]);

  const removeFavorite = async (placeId: string) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    await supabase.from("favorites").delete().eq("user_id", currentUser.id).eq("location_id", placeId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.delete(placeId);
      return next;
    });
    setItems((prev) => prev.filter((p) => p.id !== placeId));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    nav("/discover");
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--app-surface-2)] border border-[var(--app-border)] flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--app-text-muted)]" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{currentUser?.name ?? "Guest"}</div>
              <div className="text-sm text-[var(--app-text-muted)] truncate">
                {currentUser?.email ?? "Masuk untuk menyimpan favorit"}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4">
              <div className="text-xs text-[var(--app-text-muted)]">Saved places</div>
              <div className="mt-1 text-xl font-bold">{favoriteIds.size}</div>
            </div>
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4">
              <div className="text-xs text-[var(--app-text-muted)]">Account</div>
              <div className="mt-1 text-sm font-semibold">{currentUser ? "Active" : "Guest"}</div>
            </div>
          </div>

          {!currentUser ? (
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-5 w-full px-5 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] font-semibold text-sm"
            >
              Masuk / Daftar
            </button>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => nav("/favorites")}
                className="px-4 py-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] text-sm font-semibold"
              >
                Favorites
              </button>
              <button
                onClick={logout}
                className="px-4 py-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          )}

          <div className="mt-6 text-xs text-[var(--app-text-muted)]">
            Data favorit disimpan di Supabase table <span className="font-semibold">favorites</span>.
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-semibold">Saved Places</div>
              <div className="text-sm text-[var(--app-text-muted)] mt-1">Daftar tempat yang kamu simpan.</div>
            </div>
            <button
              onClick={() => nav("/map")}
              className="px-5 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] font-semibold text-sm flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Open Map
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((p) => (
              <div key={p.id} className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden">
                <div className="relative h-44">
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFavorite(p.id)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-overlay-soft)] backdrop-blur-md flex items-center justify-center"
                    aria-label="Remove favorite"
                  >
                    <Heart className="w-5 h-5 fill-[var(--app-rating)] text-[var(--app-rating)]" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="mt-1 text-sm text-[var(--app-text-muted)] truncate">{p.region}</div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => nav(`/place/${p.id}`)}
                      className="flex-1 px-4 py-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] text-sm font-semibold"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => nav(`/map?selected=${encodeURIComponent(p.id)}`)}
                      className="flex-1 px-4 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] text-sm font-semibold"
                    >
                      View on Map
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {sorted.length === 0 && (
              <div className="col-span-full mt-10 text-center text-sm text-[var(--app-text-muted)]">
                Belum ada tempat yang disimpan.
              </div>
            )}
          </div>
        </div>
      </div>

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
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Heart, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { AuthModal, type AuthUser } from "../components/AuthModal";
import type { Place } from "../data/places";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function FavoritesPage() {
  const nav = useNavigate();
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

  const toggleFavorite = async (placeId: string) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    const has = favoriteIds.has(placeId);
    if (has) {
      await supabase.from("favorites").delete().eq("user_id", currentUser.id).eq("location_id", placeId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(placeId);
        return next;
      });
      setItems((prev) => prev.filter((p) => p.id !== placeId));
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">Favorites</div>
            <div className="text-sm text-[var(--app-text-muted)] mt-1">Tempat yang kamu simpan.</div>
          </div>
          <button
            onClick={() => nav("/map")}
            className="px-5 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] font-semibold text-sm flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Open Map
          </button>
        </div>

        {!currentUser ? (
          <div className="mt-8 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
            <div className="font-semibold">Masuk untuk melihat favorit</div>
            <div className="mt-1 text-sm text-[var(--app-text-muted)]">
              Favorit tersimpan di akun Supabase kamu.
            </div>
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-4 px-5 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] font-semibold text-sm"
            >
              Masuk / Daftar
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((p) => (
              <div key={p.id} className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden">
                <div className="relative h-44">
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => toggleFavorite(p.id)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full border border-[var(--app-border)] bg-black/40 backdrop-blur-md flex items-center justify-center"
                    aria-label="Remove favorite"
                  >
                    <Heart className="w-5 h-5 fill-orange-500 text-orange-500" />
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
              <div className="col-span-full mt-8 text-center text-sm text-[var(--app-text-muted)]">
                Belum ada favorit.
              </div>
            )}
          </div>
        )}
      </div>

      <AuthModal
        open={authOpen}
        isDark={true}
        initialTab="login"
        onClose={() => setAuthOpen(false)}
        onLogin={(u) => setCurrentUser(u)}
      />
    </>
  );
}

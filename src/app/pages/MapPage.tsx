import { AddPlaceModal } from "../components/AddPlaceModal";
import { AuthModal, type AuthUser } from "../components/AuthModal";
import { supabase } from "../../lib/supabaseClient";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Heart, MapPin, Search, Sparkles, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CATEGORY_META, type Category, type Place } from "../data/places";
import { MapView } from "../components/MapView";
import { PlaceCard } from "../components/PlaceCard";
import { type Review } from "../components/PlaceDetail";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../layout/AppShell";

const CATEGORIES: Category[] = ["nature", "cultural", "traditional", "modern"];

// Haversine distance for the recommendation engine
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function MapPage() {
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const { isDark } = useTheme();
  // UI / filter state
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(CATEGORIES));
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Place | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [userPlaces, setUserPlaces] = useState<Place[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  // Location state
  const [locating, setLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  // Seed initial search from URL (e.g. /map?q=...)
  useEffect(() => {
    const q = sp.get("q");
    if (q && q.trim()) setSearch(q.trim());
  }, [sp]);

  // Seed selected place from URL (e.g. /map?selected=...)
  useEffect(() => {
    const selectedId = sp.get("selected");
    if (!selectedId || !allPlaces.length) return;
    const p = allPlaces.find((x) => x.id === selectedId);
    if (p) setSelected(p);
  }, [sp, allPlaces]);

  useEffect(() => {
    // Cek apakah user sudah login di browser ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name,
          email: session.user.email ?? ""
        });
      }
    });

    // Pantau kalau user klik login atau logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name,
          email: session.user.email ?? ""
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUser) {
        setFavorites(new Set()); // Kosongkan jika logout
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('location_id')
        .eq('user_id', currentUser.id);

      if (!error && data) {
        const favSet = new Set(data.map(f => f.location_id));
        setFavorites(favSet);
      }
    };

    fetchFavorites();
  }, [currentUser]);

  const fetchPlacesFromSupabase = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        reviews (*)
      `); // Perhatikan kurung buka-tutup untuk reviews

    if (error) {
      console.error("Gagal ambil data:", error.message);
      return;
    }

    if (data) {
      console.log("Data diterima beserta review:", data);
      setAllPlaces(data); 
    }
  };
  // Panggil fungsi ini saat pertama kali aplikasi dibuka
  useEffect(() => {
    fetchPlacesFromSupabase();
  }, []);

  const addReview = async (placeId: string, review: Review) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('reviews')
      .insert({
        location_id: placeId,
        user_id: currentUser.id,
        rating: review.rating,
        comment: review.comment,
        user_name: currentUser.name
      });

    if (!error) {
      const { data: updatedPlace, error: fetchError } = await supabase
        .from('locations')
        .select('*, reviews(*)')
        .eq('id', placeId)
        .single();

      if (!fetchError && updatedPlace) {
        // 1. UPDATE MODAL SECARA INSTAN
        setSelected({ ...updatedPlace });

        // 2. UPDATE LIST UTAMA (PENTING: Gunakan Functional Update + New Reference)
        setAllPlaces((prev) => {
          const index = prev.findIndex((p) => p.id === placeId);
          if (index === -1) return prev;

          const newPlaces = [...prev]; // Copy array
          newPlaces[index] = { ...updatedPlace }; // Ganti dengan objek baru (copy)
          return newPlaces; // Return array baru
        });
        
        console.log("Sync Berhasil!");
      }
    }
  };

  const addPlace = async (p: Place) => {
    // Pengecekan keamanan: Jika currentUser kosong, batalkan proses
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }

    const { data, error } = await supabase
      .from('locations')
      .insert([
        {
          name: p.name,
          category: p.category,
          region: p.region,
          address: p.address,
          description: p.description,
          rating: 0,
          image: p.image,
          lat: p.lat,
          lng: p.lng,
          tags: p.tags,
          // Tips: Kamu bisa menambahkan user_id pembuat jika ingin fitur "Tempat Saya"
          // created_by: currentUser.id 
        }
      ])
      .select();

    if (!error && data) {
      setAllPlaces((prev) => [...prev, data[0]]);
      setAddOpen(false);
    } else {
      console.error("Gagal menambah tempat:", error?.message);
    }
  };

  const toggleFavorite = async (placeId: string) => {
    // Cek apakah user sudah login
    if (!currentUser) {
      setSelected(null); // 1. TUTUP modal detail tempat terlebih dahulu
      setAuthOpen(true); // 2. BUKA modal login
      return;
    }

    const isAlreadyFavorite = favorites.has(placeId);

    if (isAlreadyFavorite) {
      // JIKA SUDAH FAVORIT: Hapus dari database
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('location_id', placeId);

      if (!error) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(placeId);
          return next;
        });
      }
    } else {
      // JIKA BELUM FAVORIT: Tambahkan ke database
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: currentUser.id,
          location_id: placeId
        });

      if (!error) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.add(placeId);
          return next;
        });
      }
    }
  };

  const selectPlace = (p: Place | null) => {
    setSelected(p);
    const next = new URLSearchParams(sp);
    if (p) next.set("selected", p.id);
    else next.delete("selected");
    setSp(next, { replace: true });
    // On mobile, selecting a place should open the right sidebar overlay.
    if (p && typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(true);
    }
  };

  const toggleCategory = (c: Category) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    
    // Pastikan allPlaces tidak undefined atau null sebelum di-filter
    return (allPlaces || []).filter((p) => {
      // 1. Filter Kategori
      if (!activeCategories.has(p.category)) return false;
      
      // 2. Filter Favorit (Gunakan opsional chaining agar tidak crash)
      if (showFavorites && !favorites?.has(p.id)) return false;
      
      // 3. Filter Rating
      if (p.rating < minRating) return false;
      
      // 4. Jika tidak ada pencarian, tampilkan semua yang lolos filter di atas
      if (!q) return true;
      
      // 5. Filter Pencarian (Pastikan p.tags adalah array sebelum memanggil .some)
      const tagsArray = Array.isArray(p.tags) ? p.tags : [];
      
      return (
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        tagsArray.some((t) => String(t).toLowerCase().includes(q))
      );
    });
  }, [allPlaces, activeCategories, search, showFavorites, favorites, minRating]);

  // Lightweight recommender: blends proximity, favorited categories, and rating
  const recommendations = useMemo(() => {
    const favPlaces = allPlaces.filter((p) => favorites.has(p.id));
    const preferredCats = new Set(favPlaces.map((p) => p.category));
    const ref = userLoc ?? (favPlaces[0] ? { lat: favPlaces[0].lat, lng: favPlaces[0].lng } : null);

    return [...allPlaces]
      .filter((p) => !favorites.has(p.id))
      .map((p) => {
        const dist = ref ? distanceKm(ref, p) : 0;
        const proximityScore = ref ? Math.max(0, 1 - dist / 3000) : 0.5;
        const prefScore = preferredCats.has(p.category) ? 0.4 : 0;
        const ratingScore = (p.rating - 4) * 0.3;
        return { p, score: proximityScore + prefScore + ratingScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.p);
  }, [favorites, userLoc, allPlaces]);

  const nearby = useMemo(() => {
    const list = [...filtered];
    if (userLoc) {
      list.sort((a, b) => distanceKm(userLoc, a) - distanceKm(userLoc, b));
    } else {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return list.slice(0, 3);
  }, [filtered, userLoc]);

  // Geolocation — triggers the browser's native Allow/Block popup directly
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationToast({ type: "error", msg: "Browser kamu tidak mendukung geolokasi." });
      setTimeout(() => setLocationToast(null), 4000);
      return;
    }
    // ⚠️ getCurrentPosition MUST be the first call — no state mutations before it.
    // Any setState before this can break the browser's user-gesture detection
    // and silently suppress the native Allow/Block permission dialog.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setLocationToast({ type: "success", msg: "Lokasi berhasil ditemukan!" });
        setTimeout(() => setLocationToast(null), 3000);
      },
      (err) => {
        setLocating(false);
        const messages: Record<number, string> = {
          1: "Akses lokasi ditolak. Izinkan akses lokasi di pengaturan browser.",
          2: "Lokasi tidak tersedia. Pastikan GPS aktif.",
          3: "Permintaan lokasi habis waktu. Silakan coba lagi.",
        };
        setLocationToast({ type: "error", msg: messages[err.code] ?? "Gagal mendapatkan lokasi." });
        setTimeout(() => setLocationToast(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    // State updates go AFTER getCurrentPosition is started
    setLocating(true);
    setLocationToast(null);
  };

  return (
    <div className="h-[calc(100vh-72px)] w-screen flex flex-col overflow-hidden">

      {/* Mobile search (keeps core workflow available on small screens) */}
      <div className="md:hidden px-4 py-3 shrink-0 border-b border-[var(--app-border)] bg-[color:var(--app-bg)]/70">
        <div className="flex items-center gap-3 rounded-full border border-[var(--app-border)] px-4 py-3 bg-[var(--app-surface)]">
          <Search className="w-4 h-4 text-[var(--app-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search places"
            className="bg-transparent outline-none text-sm flex-1 text-[var(--app-text)] placeholder:text-[var(--app-text-muted)]"
          />
        </div>
      </div>

      {/* CATEGORY + RATING FILTER STRIP */}
      <div className="px-4 md:px-6 py-3 flex gap-2 overflow-x-auto shrink-0 border-b border-[var(--app-border)] backdrop-blur-xl transition-colors items-center bg-[color:var(--app-bg)]/70">
        {CATEGORIES.map((c) => {
          const meta = CATEGORY_META[c];
          const active = activeCategories.has(c);
          return (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={`shrink-0 px-4 py-2 rounded-full border text-sm transition-all active:scale-95 ${
                active
                  ? "text-[var(--app-accent-fg)] border-transparent shadow-md"
                  : "bg-[var(--app-surface)] text-[var(--app-text-muted)] border-[var(--app-border)] hover:text-[var(--app-text)]"
              }`}
              style={active ? { backgroundColor: "var(--app-accent)" } : {}}
            >
              {meta.emoji} {meta.label}
            </button>
          );
        })}

        {/* Min-rating filter */}
        <div className="shrink-0 ml-auto flex items-center gap-1 pl-3 border-l border-[var(--app-border)]">
          {/* Array [0, 1, 2, 3, 4, 5] untuk mencakup semua level bintang */}
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`shrink-0 px-3 py-1.5 rounded-full border text-xs flex items-center gap-1 transition-all ${
                minRating === r
                  ? "bg-[var(--app-accent)] text-[var(--app-accent-fg)] border-transparent"
                  : "bg-[var(--app-surface)] text-[var(--app-text-muted)] border-[var(--app-border)]"
              }`}
            >
              {r === 0 ? (
                "Semua"
              ) : (
                <>
                  <Star className="w-3 h-3 fill-current" />
                  {r}{r < 5 && "+"}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN: map + sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-3 md:p-4">
          <MapView
            places={filtered}
            selected={selected}
            onSelect={(p) => selectPlace(p)}
            isDark={isDark}
            userLoc={userLoc}
            onLocate={requestLocation}
            locating={locating}
          />
        </div>

        <AnimatePresence>
          {(sidebarOpen || typeof window === "undefined" || window.innerWidth >= 768) && (
            <motion.aside
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute md:static right-0 top-0 bottom-0 w-full md:w-96 overflow-y-auto p-4 z-[400] border-l md:border-none bg-[var(--app-bg)] border-[var(--app-border)] md:bg-transparent"
            >
              {selected ? (
                <div className="rounded-3xl border overflow-hidden bg-[var(--app-surface-2)] border-[var(--app-border)]">
                  <div className="relative">
                    <ImageWithFallback
                      src={selected.image}
                      alt={selected.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[color:var(--app-bg)]" />
                    <button
                      onClick={() => selectPlace(null)}
                      aria-label="Close details"
                      className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center border border-[var(--app-border)] bg-[var(--app-overlay-soft)] backdrop-blur-md text-[var(--app-text)]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(selected.id)}
                      aria-label="Favorite"
                      className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center border border-[var(--app-border)] bg-[var(--app-overlay-soft)] backdrop-blur-md text-[var(--app-text)]"
                    >
                      <Heart className={`w-5 h-5 ${favorites.has(selected.id) ? "fill-[var(--app-rating)] text-[var(--app-rating)]" : ""}`} />
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="font-semibold text-lg">
                      {selected.name}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-[var(--app-text-muted)]">
                      <span className="inline-flex items-center gap-1 text-[var(--app-accent)]">
                        <Star className="w-4 h-4 fill-[var(--app-accent)]" />
                        {selected.rating}
                      </span>
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{selected.region}</span>
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[var(--app-text-muted)]">
                      {selected.address}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => nav(`/place/${selected.id}`)}
                        className={`py-3 rounded-2xl text-sm font-semibold transition-colors ${
                          isDark ? "bg-[var(--app-accent)] text-[var(--app-accent-fg)] hover:opacity-95" : "bg-[var(--app-accent)] text-[var(--app-accent-fg)] hover:opacity-95"
                        }`}
                      >
                        Open details
                      </button>
                      <button
                        onClick={() => selectPlace(null)}
                        className="py-3 rounded-2xl text-sm font-semibold border transition-colors bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-text)] hover:opacity-95"
                      >
                        Back to list
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-semibold tracking-[0.6px] text-[var(--app-text-muted)]">
                        About
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--app-text)]">
                        {selected.description}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Explore Nearby (Figma-style panel) */}
                  <div className="rounded-3xl p-4 mb-4 border backdrop-blur-[6px] bg-[var(--app-surface-2)] border-[var(--app-border)]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-[var(--app-text)]">Explore Nearby</div>
                      <Sparkles className="w-4 h-4 text-[var(--app-accent)]" />
                    </div>
                    <div className="text-xs mb-3 text-[var(--app-text-muted)]">
                      {userLoc ? "Closest picks based on your location" : "Top picks right now"}
                    </div>

                    <div className="space-y-2">
                      {nearby.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectPlace(p)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors bg-[var(--app-surface)] border-[var(--app-border)] hover:opacity-95"
                        >
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm leading-tight truncate">{p.name}</div>
                            <div className="text-[11px] mt-0.5 truncate text-[var(--app-text-muted)]">
                              {userLoc ? `${distanceKm(userLoc, p).toFixed(1)} km away` : `${p.region} · ⭐ ${p.rating}`}
                            </div>
                          </div>
                        </button>
                      ))}
                      {nearby.length === 0 && (
                        <div className="text-sm py-6 text-center text-[var(--app-text-muted)]">
                          Tidak ada tempat yang cocok dengan filtermu.
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      {!userLoc && (
                        <button
                          onClick={requestLocation}
                        className="flex-1 py-3 rounded-2xl border text-xs font-semibold tracking-[0.6px] transition-colors bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-text)] hover:opacity-95"
                      >
                        USE MY LOCATION
                      </button>
                    )}
                      <button
                        onClick={() => {
                          setSidebarOpen(false);
                          setShowFavorites(false);
                        }}
                    className={`flex-1 py-3 rounded-2xl text-xs font-semibold tracking-[0.6px] transition-colors ${
                      isDark ? "bg-[var(--app-accent)] text-[var(--app-accent-fg)] hover:opacity-95" : "bg-[var(--app-accent)] text-[var(--app-accent-fg)] hover:opacity-95"
                    }`}
                  >
                    EXPLORE ON MAP
                  </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[var(--app-text)]">
                      {showFavorites ? "Favoritmu" : "Tempat"}{" "}
                      <span className="text-sm text-[var(--app-text-muted)]">({filtered.length})</span>
                    </h3>
                    <button
                      onClick={() => setShowFavorites((v) => !v)}
                      className="md:hidden text-sm text-[var(--app-rating)] flex items-center gap-1"
                    >
                      <Heart className={`w-4 h-4 ${showFavorites ? "fill-[var(--app-rating)] text-[var(--app-rating)]" : ""}`} />
                      {favorites.size}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                    {filtered.map((p) => (
                      <PlaceCard
                        key={p.id}
                        place={p}
                        isFavorite={favorites.has(p.id)}
                        onToggleFavorite={toggleFavorite}
                        onSelect={(pp) => selectPlace(pp)}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <div className="text-center py-10 text-[var(--app-text-muted)] text-sm">
                        Tidak ada tempat yang cocok dengan filtermu.
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Location toast notification */}
      <AnimatePresence>
        {locationToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md text-sm max-w-sm w-[calc(100%-2rem)] ${
              locationToast.type === "success"
                ? "bg-[var(--app-success-bg)] border-[var(--app-success-border)] text-[var(--app-success-text)]"
                : "bg-[var(--app-danger-bg)] border-[var(--app-danger-border)] text-[var(--app-danger-text)]"
            }`}
          >
            <span className="text-base shrink-0">
              {locationToast.type === "success" ? "📍" : "⚠️"}
            </span>
            <span className="flex-1">{locationToast.msg}</span>
            <button
              onClick={() => setLocationToast(null)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        open={authOpen}
        isDark={isDark}
        initialTab="login"
        onClose={() => setAuthOpen(false)}
        onLogin={(user) => {
          setCurrentUser(user);
          nav("/map");
        }}
      />

      <AddPlaceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addPlace} // Hubungkan ke fungsi yang baru kita buat
        isDark={isDark}
      />
    </div>
  );
}

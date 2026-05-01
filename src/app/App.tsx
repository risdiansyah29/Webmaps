import { AddPlaceModal } from "./components/AddPlaceModal";
import { AuthModal, type AuthUser } from "./components/AuthModal";
import { UserMenu } from "./components/UserMenu";
import { supabase } from "../lib/supabaseClient";

import { useEffect, useMemo, useState } from "react";
import { Heart, MapPin, Search, Sparkles, Menu, X, Sun, Moon, Plus, Star, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CATEGORY_META, type Category, type Place } from "./data/places";
import { MapView } from "./components/MapView";
import { PlaceCard } from "./components/PlaceCard";
import { PlaceDetail, type Review } from "./components/PlaceDetail";

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

export default function App() {
  // UI / filter state
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(CATEGORIES));
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Place | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [userPlaces, setUserPlaces] = useState<Place[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Location state
  const [locating, setLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  // Restore theme preference from localStorage
  useEffect(() => {
    const t = localStorage.getItem("theme");
    if (t === "dark") setIsDark(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut(); // Menghapus sesi di database
    localStorage.removeItem("jn_session"); // Opsional, membersihkan sisa data lama
    setCurrentUser(null);
  };

  const openLogin = () => { setAuthTab("login"); setAuthOpen(true); };
  const openRegister = () => { setAuthTab("register"); setAuthOpen(true); };

  return (
    <div className={`${isDark ? "dark" : ""} h-screen w-screen flex flex-col overflow-hidden transition-colors ${isDark ? "bg-neutral-950" : "bg-neutral-50"}`}>
      {/* HEADER */}
      <header className={`px-4 md:px-6 py-3 flex items-center gap-3 shrink-0 z-[500] border-b backdrop-blur-xl transition-colors ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white/80 border-neutral-200/70"}`}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 via-green-600 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-green-500/30 ring-1 ring-white/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <div className={`leading-tight font-bold ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>PointInterest</div>
            <div className={`text-xs leading-tight ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Peta wisata & kuliner Indonesia</div>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-auto relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-neutral-500" : "text-neutral-400"}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tempat, daerah, atau tag..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-full border focus:outline-none focus:ring-2 transition-all text-sm ${
              isDark
                ? "border-neutral-700 bg-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:border-green-500 focus:ring-green-900"
                : "border-neutral-200 bg-neutral-50 focus:bg-white focus:border-green-500 focus:ring-green-100"
            }`}
          />
        </div>

        {/* Add new place */}
        <button
          onClick={() => {
            if (!currentUser) {
              setAuthOpen(true); // Buka login jika belum masuk
            } else {
              setAddOpen(true);  // Buka modal tambah tempat jika sudah login
            }
          }}
          aria-label="Add new place"
          className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Day/Night toggle */}
        <button
          onClick={() => setIsDark((v) => !v)}
          aria-label="Toggle day/night mode"
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
            isDark
              ? "bg-neutral-800 border-neutral-700 text-yellow-300 hover:bg-neutral-700"
              : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setShowFavorites((v) => !v)}
          className={`hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full border transition-colors text-sm ${
            showFavorites
              ? "bg-orange-500 text-white border-orange-500"
              : isDark
                ? "bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-orange-400"
                : "bg-white text-neutral-700 border-neutral-200 hover:border-orange-400"
          }`}
        >
          <Heart className={`w-4 h-4 ${showFavorites ? "fill-white" : ""}`} />
          {favorites.size}
        </button>

        {/* Auth area */}
        {currentUser ? (
          <UserMenu
            user={currentUser}
            isDark={isDark}
            favoritesCount={favorites.size}
            placesCount={userPlaces.length} // Mengambil data dari state userPlaces yang sudah kita siapkan
            onLogout={handleLogout}
          />
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={openLogin}
              className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                isDark
                  ? "border-neutral-700 text-neutral-200 hover:border-green-500 hover:text-green-400"
                  : "border-neutral-200 text-neutral-700 hover:border-green-500 hover:text-green-600"
              }`}
            >
              Masuk
            </button>
            <button
              onClick={openRegister}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm hover:shadow-lg hover:shadow-green-500/25 transition-all hover:scale-105 active:scale-95"
            >
              Daftar
            </button>
          </div>
        )}

        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className={`md:hidden w-10 h-10 rounded-full border flex items-center justify-center ${isDark ? "border-neutral-700 text-neutral-200" : "border-neutral-200"}`}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile auth button strip (shown only when no user + mobile) */}
      {!currentUser && (
        <div className={`md:hidden flex gap-2 px-4 py-2 shrink-0 border-b ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white/70 border-neutral-200/70"}`}>
          <button
            onClick={openLogin}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm transition-colors ${
              isDark ? "border-neutral-700 text-neutral-300" : "border-neutral-200 text-neutral-600"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Masuk
          </button>
          <button
            onClick={openRegister}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm"
          >
            Daftar Gratis
          </button>
          {currentUser === null && (
            <p className={`ml-auto self-center text-xs ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
              Masuk untuk menyimpan favorit
            </p>
          )}
        </div>
      )}

      {/* CATEGORY + RATING FILTER STRIP */}
      <div className={`px-4 md:px-6 py-3 flex gap-2 overflow-x-auto shrink-0 border-b backdrop-blur-xl transition-colors items-center ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white/70 border-neutral-200/70"}`}>
        {CATEGORIES.map((c) => {
          const meta = CATEGORY_META[c];
          const active = activeCategories.has(c);
          return (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={`shrink-0 px-4 py-1.5 rounded-full border text-sm transition-all hover:scale-105 active:scale-95 ${
                active
                  ? "text-white border-transparent shadow-md"
                  : isDark
                    ? "bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:border-neutral-500"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
              }`}
              style={active ? { backgroundColor: meta.color } : {}}
            >
              {meta.emoji} {meta.label}
            </button>
          );
        })}

        {/* Min-rating filter */}
        <div className={`shrink-0 ml-auto flex items-center gap-1 pl-3 border-l ${isDark ? "border-neutral-800" : "border-neutral-200"}`}>
          {/* Array [0, 1, 2, 3, 4, 5] untuk mencakup semua level bintang */}
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`shrink-0 px-3 py-1.5 rounded-full border text-xs flex items-center gap-1 transition-all ${
                minRating === r
                  ? "bg-orange-500 text-white border-orange-500"
                  : isDark
                    ? "bg-neutral-800 text-neutral-300 border-neutral-700"
                    : "bg-white text-neutral-600 border-neutral-200"
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
            onSelect={setSelected}
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
              className={`absolute md:static right-0 top-0 bottom-0 w-full md:w-96 overflow-y-auto p-4 z-[400] border-l md:border-none ${isDark ? "bg-neutral-900 md:bg-transparent border-neutral-800" : "bg-white md:bg-transparent border-neutral-200"}`}
            >
              {/* Recommendation panel */}
              <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-600 to-green-800 rounded-3xl p-4 mb-4 text-white shadow-lg shadow-green-500/20">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-6 w-24 h-24 bg-orange-300/20 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <h3>Rekomendasi untukmu</h3>
                </div>
                <p className="text-sm text-green-50 mb-3">
                  {userLoc ? "Berdasarkan lokasi & favoritmu" : "Aktifkan lokasi untuk personalisasi"}
                </p>
                {!userLoc && (
                  <button
                    onClick={requestLocation}
                    className="text-xs bg-white text-green-700 px-3 py-1.5 rounded-full hover:bg-green-50 transition-colors mb-3"
                  >
                    📍 Gunakan lokasiku
                  </button>
                )}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {recommendations.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="shrink-0 w-32 bg-white/95 rounded-xl overflow-hidden text-left hover:scale-105 transition-transform"
                    >
                      <img src={p.image} alt={p.name} className="w-full h-16 object-cover" />
                      <div className="p-2">
                        <div className="text-xs text-neutral-900 line-clamp-1">{p.name}</div>
                        <div className="text-[10px] text-neutral-500">⭐ {p.rating}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className={isDark ? "text-neutral-100" : "text-neutral-900"}>
                  {showFavorites ? "Favoritmu" : "Tempat"}{" "}
                  <span className={`text-sm ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>({filtered.length})</span>
                </h3>
                <button
                  onClick={() => setShowFavorites((v) => !v)}
                  className="md:hidden text-sm text-orange-500 flex items-center gap-1"
                >
                  <Heart className={`w-4 h-4 ${showFavorites ? "fill-orange-500" : ""}`} />
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
                    onSelect={setSelected}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-10 text-neutral-500 text-sm">
                    Tidak ada tempat yang cocok dengan filtermu.
                  </div>
                )}
              </div>
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
                ? isDark
                  ? "bg-green-900/90 border-green-700 text-green-100"
                  : "bg-green-50 border-green-200 text-green-800"
                : isDark
                  ? "bg-red-900/90 border-red-700 text-red-100"
                  : "bg-red-50 border-red-200 text-red-800"
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
        initialTab={authTab}
        onClose={() => setAuthOpen(false)}
        onLogin={(user) => setCurrentUser(user)}
      />

      <PlaceDetail
        key={selected?.id || 'none'}
        place={selected}
        isFavorite={selected ? favorites.has(selected.id) : false}
        reviews={(selected as any)?.reviews || []}
        currentUser={currentUser}
        isDark={isDark}
        onToggleFavorite={toggleFavorite}
        onAddReview={addReview}
        onOpenAuth={() => setAuthOpen(true)}
        onClose={() => setSelected(null)}
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
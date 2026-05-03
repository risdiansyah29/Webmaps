import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { CATEGORY_META, type Category, type Place } from "../data/places";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (place: Place) => void;
  isDark: boolean;
}

// Modal form for users to contribute a new location to the map.
export function AddPlaceModal({ open, onClose, onAdd, isDark }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("nature");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setName(""); setRegion(""); setAddress(""); setDescription("");
    setImage(""); setLat(""); setLng(""); setError(""); setCategory("nature");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (!name || !region || !address || isNaN(latN) || isNaN(lngN)) {
      setError("Mohon isi semua kolom dengan latitude/longitude yang valid.");
      return;
    }
    onAdd({
      id: `user-${Date.now()}`,
      name,
      category,
      region,
      address,
      description: description || "Tempat ditambahkan oleh pengguna.",
      rating: 0,
      image: image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
      lat: latN,
      lng: lngN,
      tags: ["ditambahkan-pengguna"],
    });
    reset();
    onClose();
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
    isDark
      ? "bg-neutral-800 border-neutral-700 text-neutral-100 focus:ring-[color:var(--app-accent)]/25 focus:border-[var(--app-accent)]"
      : "bg-white border-neutral-200 focus:ring-[color:var(--app-accent)]/20 focus:border-[var(--app-accent)]"
  }`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[1100] flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className={`w-full md:max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl ${isDark ? "bg-neutral-900" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-neutral-800" : "border-neutral-200"}`}>
              <h3 className={isDark ? "text-neutral-100" : "text-neutral-900"}>Tambah tempat baru</h3>
              <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <input className={inputCls} placeholder="Nama tempat *" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className={inputCls}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                    <option key={c} value={c}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</option>
                  ))}
                </select>
                <input className={inputCls} placeholder="Daerah *" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
              <input className={inputCls} placeholder="Alamat lengkap *" value={address} onChange={(e) => setAddress(e.target.value)} />
              <textarea
                className={`${inputCls} h-20 resize-none`}
                placeholder="Deskripsi singkat"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input className={inputCls} placeholder="URL gambar (opsional)" value={image} onChange={(e) => setImage(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Lintang * (contoh -8.4)" value={lat} onChange={(e) => setLat(e.target.value)} />
                <input className={inputCls} placeholder="Bujur * (contoh 115.2)" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
              <p className="text-xs text-neutral-500">Tips: klik kanan di Google Maps untuk menyalin koordinat.</p>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className={`flex-1 py-2.5 rounded-full border text-sm ${isDark ? "border-neutral-700 text-neutral-200" : "border-neutral-200 text-neutral-700"}`}>
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-full bg-[var(--app-accent)] text-[var(--app-accent-fg)] hover:opacity-95 text-sm transition-colors">
                  Tambah tempat
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

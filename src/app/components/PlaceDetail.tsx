import { useState, type FormEvent } from "react";
import { Heart, MapPin, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORY_META, type Place } from "../data/places";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AuthUser } from "../../types/auth";

export interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Props {
  place: Place | null;
  isFavorite: boolean;
  reviews: Review[];
  currentUser: AuthUser | null; // Tambahkan ini
  isDark: boolean;              // Tambahkan ini untuk styling
  onToggleFavorite: (id: string) => void;
  onAddReview: (placeId: string, review: Review) => void;
  onOpenAuth: () => void;       // Tambahkan ini
  onClose: () => void;
}

// Simple interactive star input
function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 ${
              n <= (hover || value)
                ? "fill-[var(--app-rating)] text-[var(--app-rating)]"
                : "text-[color:color-mix(in_srgb,var(--app-text)_25%,transparent)]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function PlaceDetail({
  place, isFavorite, reviews, onToggleFavorite, onAddReview, onClose, currentUser, onOpenAuth, isDark
}: Props) {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);

  // Average reviewer rating (separate from the seeded place.rating)
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const submitReview = (e: FormEvent) => {
    e.preventDefault();
    if (!place || !comment.trim() || rating === 0 || !currentUser) return; // Tambah cek currentUser

    onAddReview(place.id, {
      id: `r-${Date.now()}`,
      user_name: currentUser.name, // Ambil otomatis dari profil login
      rating,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    });
    
    setComment(""); 
    setRating(0);
  };

  return (
    <AnimatePresence>
      {place && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[var(--app-overlay-soft)] z-[1000] flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-[var(--app-bg)] w-full md:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl border border-[var(--app-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-56 shrink-0">
              <ImageWithFallback src={place.image} alt={place.name} className="w-full h-full object-cover" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[var(--app-overlay-soft)] border border-[var(--app-border)] backdrop-blur-md flex items-center justify-center hover:opacity-95 text-[var(--app-text)]"
              >
                <X className="w-5 h-5" />
              </button>
              <span
                className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: CATEGORY_META[place.category].color }}
              >
                {CATEGORY_META[place.category].emoji} {CATEGORY_META[place.category].label}
              </span>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-[var(--app-text)]">{place.name}</h2>
                <button
                  onClick={() => onToggleFavorite(place.id)}
                  className="shrink-0 w-10 h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] flex items-center justify-center hover:opacity-95"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-[var(--app-rating)] text-[var(--app-rating)]" : "text-[var(--app-text-muted)]"}`} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm mb-4">
                <span className="flex items-center gap-1 text-[var(--app-rating)]">
                  <Star className="w-4 h-4 fill-[var(--app-rating)]" /> {place.rating || (avg?.toFixed(1) ?? "—")}
                </span>
                {avg !== null && (
                  <span className="text-xs text-[var(--app-text-muted)]">({reviews.length} ulasan)</span>
                )}
                <span className="text-[color:color-mix(in_srgb,var(--app-text)_25%,transparent)]">|</span>
                <span className="flex items-center gap-1 text-[var(--app-text-muted)]">
                  <MapPin className="w-4 h-4" /> {place.region}
                </span>
              </div>
              <p className="text-[var(--app-text-muted)] mb-4">{place.description}</p>
              <div className="bg-[color:var(--app-accent)]/10 rounded-xl p-3 mb-4 border border-[color:var(--app-accent)]/15">
                <div className="text-xs text-[var(--app-accent)] mb-1">Alamat</div>
                <div className="text-sm text-[var(--app-text)]">{place.address}</div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {place.tags.map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full bg-[var(--app-surface-2)] border border-[var(--app-border)] text-[var(--app-text)] text-xs">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Reviews list */}
              <div className="border-t border-[var(--app-border)] pt-4">
                <h3 className="mb-3 text-[var(--app-text)]">Ulasan ({reviews.length})</h3>
                <div className="space-y-3 mb-4">
                  {reviews.length === 0 && (
                    <p className="text-sm text-[var(--app-text-muted)]">Belum ada ulasan — jadilah yang pertama!</p>
                  )}
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[var(--app-text)]">{r.user_name}</span>
                        <span className="text-xs text-[var(--app-text-muted)]">{r.created_at}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${
                              n <= r.rating
                                ? "fill-[var(--app-rating)] text-[var(--app-rating)]"
                                : "text-[color:color-mix(in_srgb,var(--app-text)_25%,transparent)]"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-[var(--app-text-muted)]">{r.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Review form */}
                <div className="mt-4">
                  {currentUser ? (
                    <form onSubmit={submitReview} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--app-text)]">Rating kamu</span>
                        <StarInput value={rating} onChange={setRating} />
                      </div>
                      {/* Input nama dihapus karena kita ambil dari data login */}
                      <textarea
                        placeholder={`Beri ulasan sebagai ${currentUser.name}...`}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full px-3 py-2 h-20 resize-none rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--app-accent)]/15"
                      />
                      <button
                        type="submit"
                        disabled={!comment.trim() || rating === 0}
                        className="w-full py-2.5 rounded-full bg-[var(--app-accent)] text-[var(--app-accent-fg)] hover:opacity-95 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Kirim ulasan
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 rounded-xl border text-center bg-[var(--app-surface-2)] border-[var(--app-border)]">
                      <p className="text-sm text-[var(--app-text-muted)] mb-3">
                        Kamu harus masuk akun untuk memberikan ulasan.
                      </p>
                      <button
                        onClick={() => {
                          onClose();      // Tutup modal detail tempat dulu
                          onOpenAuth();   // Baru buka modal login
                        }}
                        className="text-sm font-semibold text-[var(--app-accent)] hover:opacity-90 transition-colors"
                      >
                        Masuk Sekarang
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

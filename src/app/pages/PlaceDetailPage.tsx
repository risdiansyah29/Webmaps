import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CalendarDays, ChevronLeft, Heart, MapPin, Share2, Star, Users } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import type { Place } from "../data/places";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../layout/AppShell";

type Review = {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function PlaceDetailPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const { isDark } = useTheme();

  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data, error } = await supabase.from("locations").select("*").eq("id", id).single();
      if (!error && data) setPlace(data as any);
      const { data: revs } = await supabase
        .from("reviews")
        .select("*")
        .eq("location_id", id)
        .order("created_at", { ascending: false });
      setReviews((revs as any) ?? []);
    };
    fetch();
  }, [id]);

  const ratingAvg = useMemo(() => {
    if (!reviews.length) return null;
    return reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length;
  }, [reviews]);

  const gallery = useMemo(() => {
    const main = place?.image ? [place.image] : [];
    const seed = encodeURIComponent(place?.name ?? "place");
    const extras = [
      `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=70&sig=${seed}1`,
      `https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=70&sig=${seed}2`,
      `https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=900&q=70&sig=${seed}3`,
      `https://images.unsplash.com/photo-1541544181074-e8b146f6f2f4?auto=format&fit=crop&w=900&q=70&sig=${seed}4`,
      `https://images.unsplash.com/photo-1555992336-03a23c07c3f2?auto=format&fit=crop&w=900&q=70&sig=${seed}5`,
    ];
    return [...main, ...extras].slice(0, 5);
  }, [place]);

  return (
      <main className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => nav(-1)}
            className={clsx(
              "w-10 h-10 rounded-full border flex items-center justify-center",
              "bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
            )}
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-semibold truncate">{place?.name ?? "Loading…"}</div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsFavorite((v) => !v)}
              className={clsx(
                "w-10 h-10 rounded-full border flex items-center justify-center",
                "bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
              )}
              aria-label="Save"
            >
              <Heart className={clsx("w-5 h-5", isFavorite ? "fill-[var(--app-rating)] text-[var(--app-rating)]" : "")} />
            </button>
            <button
              className={clsx(
                "w-10 h-10 rounded-full border flex items-center justify-center",
                "bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
              )}
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4">
          <div className="rounded-3xl overflow-hidden border border-[var(--app-border)] bg-[var(--app-surface)]">
            <ImageWithFallback src={gallery[0]} alt="" className="w-full h-[360px] lg:h-[420px] object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {gallery.slice(1, 5).map((src, i) => (
              <div key={i} className="relative rounded-3xl overflow-hidden border border-[var(--app-border)] bg-[var(--app-surface)]">
                <ImageWithFallback src={src} alt="" className="w-full h-[170px] lg:h-[200px] object-cover" />
                {i === 3 && (
                  <div className="absolute inset-0 bg-[var(--app-overlay-soft)] flex items-center justify-center">
                    <div className="text-sm font-semibold">+12 photos</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header + actions */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div>
            <div className="font-semibold text-2xl">{place?.name ?? "—"}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--app-text-muted)]">
              <span className="inline-flex items-center gap-1 text-[var(--app-accent)]">
                <Star className="w-4 h-4 fill-[var(--app-accent)]" />
                {place?.rating ?? (ratingAvg?.toFixed(1) ?? "—")}
              </span>
              <span className="text-[var(--app-text-muted)]">{reviews.length.toLocaleString()} reviews</span>
                <span className="inline-flex items-center gap-2 text-[var(--app-text-muted)]">
                  <span className="px-3 py-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-xs">Fine Dining</span>
                </span>
              {place?.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{place.address}</span>
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="px-6 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] hover:opacity-95 font-semibold text-sm">
                Get Directions
              </button>
              <button
                onClick={() => setIsFavorite((v) => !v)}
                className="px-5 py-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] font-semibold text-sm flex items-center gap-2 hover:opacity-95"
              >
                <Heart className={clsx("w-4 h-4", isFavorite ? "fill-[var(--app-rating)] text-[var(--app-rating)]" : "")} />
                Save
              </button>
              <button className="px-5 py-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] font-semibold text-sm flex items-center gap-2 hover:opacity-95">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* About */}
            <div className="mt-8">
              <div className="font-semibold">About the experience</div>
              <p className="mt-2 text-sm text-[var(--app-text-muted)] leading-relaxed">
                {place?.description ??
                  "A curated destination with a signature atmosphere. Explore highlights, amenities, and recent reviews."}
              </p>
            </div>

            {/* Amenities */}
            <div className="mt-6 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
              <div className="font-semibold">Amenities & Details</div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-[var(--app-text)]">
                {[
                  "Free High-speed WiFi",
                  "Outdoor Seating",
                  "Curated Wine Cellar",
                  "Valet Parking",
                  "Cards Accepted",
                  "Live Jazz Weekends",
                  "Family Friendly",
                  "Wheelchair Access",
                ].map((t) => (
                  <div key={t} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-3">
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Guest Reviews</div>
                <div className="text-xs text-[var(--app-text-muted)]">Latest Reviews</div>
              </div>
              <div className="mt-4 space-y-4">
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{r.user_name}</div>
                      <div className="text-xs text-[var(--app-text-muted)]">{fmtDate(r.created_at)}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={clsx(
                            "w-4 h-4",
                            i < (r.rating ?? 0)
                              ? "fill-[var(--app-accent)] text-[var(--app-accent)]"
                              : "text-[color:color-mix(in_srgb,var(--app-text)_20%,transparent)]",
                          )}
                        />
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-[var(--app-text-muted)] leading-relaxed">{r.comment}</div>
                  </div>
                ))}
                {!reviews.length && (
                  <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-sm text-[var(--app-text-muted)]">
                    Belum ada ulasan untuk tempat ini.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side card */}
          <aside className="space-y-4">
            <button
              onClick={() => nav(`/map?selected=${encodeURIComponent(id ?? "")}`)}
              className="w-full rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden text-left"
            >
              <div className="relative h-40">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=70"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[color:var(--app-bg)]" />
                <div className="absolute bottom-4 left-4 text-sm font-semibold">View on Map</div>
                <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[var(--app-accent)] text-[var(--app-accent-fg)] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </button>
          </aside>
        </div>
      </main>
  );
}

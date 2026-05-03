import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Heart, MapPin, Search } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import type { Place } from "../data/places";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const HERO_BG =
  "https://www.figma.com/api/mcp/asset/1c86b5cf-a661-42a3-89d0-24694b42fe99";
const SIM_MAP_BG =
  "https://www.figma.com/api/mcp/asset/ec59b1b5-fee1-4f88-82c7-1e88e97f334e";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function LandingPage() {
  const nav = useNavigate();

  const [searchWhere, setSearchWhere] = useState("");
  const [searchType, setSearchType] = useState("");
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);

  useEffect(() => {
    const fetchPlaces = async () => {
      const { data, error } = await supabase.from("locations").select("*");
      if (error) return;
      setAllPlaces((data as any) ?? []);
    };
    fetchPlaces();
  }, []);

  const editorsChoice = useMemo(() => {
    return [...allPlaces]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 4);
  }, [allPlaces]);

  const exploreNearby = useMemo(() => {
    return [...allPlaces]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 3);
  }, [allPlaces]);

  const goMap = () => {
    const params = new URLSearchParams();
    if (searchWhere.trim()) params.set("q", searchWhere.trim());
    if (searchType.trim()) params.set("type", searchType.trim());
    const qs = params.toString();
    nav(qs ? `/map?${qs}` : "/map");
  };

  const goMapSelected = (placeId: string) => {
    const params = new URLSearchParams();
    if (searchWhere.trim()) params.set("q", searchWhere.trim());
    if (searchType.trim()) params.set("type", searchType.trim());
    params.set("selected", placeId);
    nav(`/map?${params.toString()}`);
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6">
        {/* Hero */}
        <section className="pt-10">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10">
            <div className="absolute inset-0">
              <ImageWithFallback src={HERO_BG} alt="" className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-[var(--app-bg)]" />
            </div>

            <div className="relative px-6 md:px-10 py-16 md:py-20 flex flex-col items-center text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-[-1px] text-[var(--app-text)]">
                Find places worth going.
              </h1>

              <div className="mt-8 w-full max-w-[720px] rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-2)] backdrop-blur-md overflow-hidden shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.25)]">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto]">
                  <div className="px-6 py-5 border-b md:border-b-0 md:border-r border-[var(--app-border)] text-left">
                    <div className="text-[10px] font-semibold tracking-[0.6px] text-[var(--app-text-muted)]">WHERE</div>
                    <input
                      value={searchWhere}
                      onChange={(e) => setSearchWhere(e.target.value)}
                      placeholder="Search destinations"
                      className="mt-1 w-full bg-transparent outline-none text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)]"
                    />
                  </div>
                  <div className="px-6 py-5 border-b md:border-b-0 md:border-r border-[var(--app-border)] text-left">
                    <div className="text-[10px] font-semibold tracking-[0.6px] text-[var(--app-text-muted)]">TYPE</div>
                    <input
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      placeholder="What's the vibe?"
                      className="mt-1 w-full bg-transparent outline-none text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)]"
                    />
                  </div>
                  <div className="p-3 flex items-center justify-center">
                    <button
                      onClick={goMap}
                      className="w-full md:w-auto px-7 py-4 rounded-full bg-[var(--app-accent)] text-[var(--app-accent-fg)] font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Explore
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-3 flex-wrap justify-center">
                {[
                  { label: "Restaurant", icon: MapPin },
                  { label: "Cafe", icon: MapPin },
                  { label: "Outdoor", icon: MapPin },
                  { label: "Tourist spots", icon: MapPin },
                  { label: "Nightlife", icon: MapPin },
                ].map((x) => (
                  <button
                    key={x.label}
                    className={clsx(
                      "px-5 py-2.5 rounded-full border text-xs font-semibold tracking-[0.2px] flex items-center gap-2",
                      x.label === "Restaurant"
                        ? "bg-[var(--app-text)] text-[var(--app-bg)] border-[var(--app-border)]"
                        : "bg-[var(--app-surface-2)] text-[var(--app-text-muted)] border-[var(--app-border)] hover:text-[var(--app-text)]"
                    )}
                  >
                    <x.icon className="w-4 h-4 opacity-80" />
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Editor's Choice */}
        <section className="pt-12">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-semibold text-[var(--app-text)]">Editor's Choice</div>
              <div className="text-xs text-[var(--app-text-muted)] mt-1">
                Hand-picked destinations with exceptional atmosphere.
              </div>
            </div>
            <button className="text-xs font-semibold text-[var(--app-accent)] flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {editorsChoice.map((p) => (
              <button
                key={p.id}
                onClick={() => goMapSelected(p.id)}
                className="text-left rounded-2xl overflow-hidden border border-white/10 bg-[#11161d] hover:border-white/15 transition-colors"
              >
                <div className="relative h-44">
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 border border-[var(--app-border)] flex items-center justify-center">
                    <Heart className="w-4 h-4 text-[var(--app-text-muted)]" />
                  </div>
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/40 border border-[var(--app-border)] text-[10px] font-semibold text-[var(--app-text-muted)]">
                    {p.category}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[var(--app-text)] font-semibold truncate">{p.name}</div>
                  <div className="mt-1 text-xs text-[var(--app-text-muted)] truncate">{p.region}</div>
                  <div className="mt-2 text-xs text-[var(--app-text-muted)] truncate">{"$".repeat(3)} · {p.tags?.[0] ?? "Signature menu"}</div>
                </div>
              </button>
            ))}
            {editorsChoice.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-white/45">
                Belum ada data lokasi.
              </div>
            )}
          </div>
        </section>

        {/* Explore Nearby */}
        <section className="pt-12 pb-20">
          <div className="rounded-3xl border border-white/10 bg-[#0b0f14]">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-0">
              <div className="p-6">
                <div className="text-lg font-semibold text-white">Explore Nearby</div>
                <div className="mt-1 text-xs text-white/45">Quick picks around you.</div>
                <div className="mt-4 space-y-3">
                  {exploreNearby.map((p) => (
                    <button
                      key={p.id}
                      onClick={goMap}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-[#11161d] hover:border-white/15 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[rgba(127,255,212,0.15)] flex items-center justify-center shrink-0 overflow-hidden">
                        <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white/90 truncate">{p.name}</div>
                        <div className="text-[11px] text-white/45 truncate">{p.region}</div>
                      </div>
                    </button>
                  ))}
                  {exploreNearby.length === 0 && (
                    <div className="py-6 text-center text-sm text-white/45">
                      Belum ada data lokasi.
                    </div>
                  )}
                </div>

                <button
                  onClick={goMap}
                  className="mt-5 w-full py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95"
                >
                  <MapPin className="w-4 h-4" />
                  Explore on Map
                </button>
              </div>

              <div className="relative min-h-[320px] lg:min-h-[420px] overflow-hidden rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl border-t lg:border-t-0 lg:border-l border-white/10">
                <ImageWithFallback src={SIM_MAP_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(11,15,20,0.2)] to-[#0b0f14]" />

                {/* Minimal map controls (visual only) */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                  <button className="w-11 h-11 rounded-full border border-white/10 bg-[#11161d]/80 backdrop-blur-md flex items-center justify-center">
                    <PlusIcon />
                  </button>
                  <button className="w-11 h-11 rounded-full border border-white/10 bg-[#11161d]/80 backdrop-blur-md flex items-center justify-center">
                    <MinusIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
    </svg>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { AuthModal, type AuthUser } from "../components/AuthModal";

type ReservationRow = {
  id: string;
  user_id: string;
  location_id: string;
  date: string;
  guests: number;
  status: string;
  created_at: string;
};

type LocationRow = {
  id: string;
  name: string;
  region: string;
  image: string;
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

export default function ReservationsPage() {
  const nav = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [locations, setLocations] = useState<Record<string, LocationRow>>({});


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
        setRows([]);
        setLocations({});
        return;
      }
      const { data } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });
      const r = (data as any as ReservationRow[]) ?? [];
      setRows(r);
      const ids = Array.from(new Set(r.map((x) => x.location_id))).filter(Boolean);
      if (!ids.length) {
        setLocations({});
        return;
      }
      const { data: locs } = await supabase.from("locations").select("id,name,region,image").in("id", ids);
      const map: Record<string, LocationRow> = {};
      for (const l of (locs as any as LocationRow[]) ?? []) map[l.id] = l;
      setLocations(map);
    };
    load();
  }, [currentUser]);

  const hydrated = useMemo(() => {
    return rows.map((r) => ({ r, loc: locations[r.location_id] }));
  }, [rows, locations]);

  return (
    <>
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">Reservations</div>
            <div className="text-sm text-[var(--app-text-muted)] mt-1">Riwayat reservasi kamu.</div>
          </div>
          <button
            onClick={() => nav("/discover")}
            className="px-5 py-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] font-semibold text-sm"
          >
            Back to Discover
          </button>
        </div>

        {!currentUser ? (
          <div className="mt-8 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
            <div className="font-semibold">Masuk untuk melihat reservasi</div>
            <div className="mt-1 text-sm text-[var(--app-text-muted)]">
              Reservasi tersimpan di akun Supabase kamu.
            </div>
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-4 px-5 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] font-semibold text-sm"
            >
              Masuk / Daftar
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {hydrated.map(({ r, loc }) => (
              <div key={r.id} className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--app-surface-2)] border border-[var(--app-border)] overflow-hidden shrink-0">
                  {loc?.image ? <img src={loc.image} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{loc?.name ?? "Unknown place"}</div>
                  <div className="mt-1 text-sm text-[var(--app-text-muted)] flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" /> {fmtDate(r.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4" /> {r.guests} guests
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {loc?.region ?? "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Status: {r.status ?? "pending"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => nav(`/map?selected=${encodeURIComponent(r.location_id)}`)}
                  className="px-4 py-3 rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-fg)] font-semibold text-sm shrink-0"
                >
                  View on Map
                </button>
              </div>
            ))}
            {hydrated.length === 0 && (
              <div className="mt-10 text-center text-sm text-[var(--app-text-muted)]">
                Belum ada reservasi.
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

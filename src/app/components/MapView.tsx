import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_META, type Place } from "../data/places";

// Build a colored pin DivIcon per category
const makeIcon = (color: string, emoji: string) =>
  L.divIcon({
    className: "custom-pin",
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.25);border:2px solid white;">
      <span style="transform:rotate(45deg);font-size:16px;">${emoji}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

interface Props {
  places: Place[];
  selected: Place | null;
  onSelect: (p: Place) => void;
  isDark?: boolean;
  userLoc?: { lat: number; lng: number } | null;
  onLocate?: () => void;
  locating?: boolean;
}

// Pulsing blue dot for the user's current location
const userIcon = L.divIcon({
  className: "user-loc-pin",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Vanilla Leaflet map — bypasses react-leaflet to avoid bundler/version issues.
export function MapView({ places, selected, onSelect, isDark, userLoc, onLocate, locating }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Initialize map exactly once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-2.5, 118],
      zoom: 5,
      scrollWheelZoom: true,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) {
      map.removeLayer(tileRef.current);
    }
    const url = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    
    tileRef.current = L.tileLayer(url, {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
  }, [isDark]);

  // 4. Sinkronisasi Marker & Popup Detail Estetik
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = markersRef.current;
    const nextIds = new Set(places.map((p) => p.id));

    existing.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        map.removeLayer(marker);
        existing.delete(id);
      }
    });

    places.forEach((p) => {
      if (existing.has(p.id)) return;
      const meta = CATEGORY_META[p.category];
      if (!meta) return;

      const marker = L.marker([p.lat, p.lng], { icon: makeIcon(meta.color, meta.emoji) });

      // Membuat kontainer pop-up yang bisa diklik
      const popupDiv = document.createElement('div');
      popupDiv.className = "popup-inner-container"; // Untuk target klik
      popupDiv.style.cssText = "width:220px; cursor:pointer;";

      popupDiv.innerHTML = `
        <img src="${p.image}" style="width:100%; height:115px; object-fit:cover; display:block;" />
        <div class="popup-inner-content" style="padding:12px;">
          <strong style="font-size:15px; color:#1a1a1a; display:block;">${p.name}</strong>
          <div style="font-size:13px; color:#4b5563; margin-top:4px; display:flex; align-items:center; gap:4px;">
            <span style="color:#f59e0b;">⭐</span> 
            <span>${p.rating}</span>
            <span style="color:#9ca3af;">·</span>
            <span>${p.region}</span>
          </div>
          <p style="font-size:12px; color:#6b7280; margin-top:6px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
            ${p.description}
          </p>
        </div>
      `;

      // Seluruh area pop-up sekarang memicu onSelect
      popupDiv.onclick = () => {
        onSelectRef.current(p);
        marker.closePopup();
      };

      // Menambahkan class custom agar styling Leaflet bawaan tidak merusak desain
      marker.bindPopup(popupDiv, {
        className: 'modern-popup',
        maxWidth: 250
      });

      marker.addTo(map);
      existing.set(p.id, marker);
    });
  }, [places]);
  // Drop / update the user's current-location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userLoc) {
      userMarkerRef.current = L.marker([userLoc.lat, userLoc.lng], { icon: userIcon })
        .bindPopup("Lokasi kamu")
        .addTo(map);
    }
  }, [userLoc]);

  // Fly to the selected place
  useEffect(() => {
    if (selected && mapRef.current) {
      mapRef.current.flyTo([selected.lat, selected.lng], 18, { duration: 1.2 });
    }
  }, [selected]);

  // Auto-fly to user's location whenever it updates
  useEffect(() => {
    if (userLoc && mapRef.current) {
      mapRef.current.flyTo([userLoc.lat, userLoc.lng], 11, { duration: 1.4 });
    }
  }, [userLoc]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-sm" />

      {/* Floating "current location" FAB */}
      {onLocate && (
        <button
          onClick={onLocate}
          disabled={locating}
          aria-label="Lokasi saat ini"
          title={locating ? "Mencari lokasi…" : userLoc ? "Perbarui lokasi" : "Lokasi saat ini"}
          className={`absolute bottom-5 right-5 w-12 h-12 rounded-full backdrop-blur-md shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-[400] disabled:cursor-wait disabled:hover:scale-100 ${
            userLoc
              ? "bg-[var(--app-accent)] text-[var(--app-accent-fg)] border border-transparent shadow-black/20"
              : "bg-[var(--app-surface-2)] text-[var(--app-text)] border border-[var(--app-border)]"
          }`}
        >
          {locating ? (
            /* Spinner while awaiting permission / GPS fix */
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            /* Crosshair icon — filled when location is active */
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill={userLoc ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

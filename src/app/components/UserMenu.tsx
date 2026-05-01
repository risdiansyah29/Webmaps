import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, User, ChevronDown, Shield } from "lucide-react";
import type { AuthUser } from "./AuthModal";

interface Props {
  user: AuthUser;
  isDark: boolean;
  favoritesCount: number;
  placesCount: number; // Tambahkan ini untuk menampilkan jumlah tempat
  onLogout: () => void;
}

/** Generate a consistent color from a string */
function stringToColor(str: string): string {
  const colors = [
    "from-green-400 to-emerald-600",
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-orange-400 to-rose-500",
    "from-teal-400 to-cyan-600",
    "from-indigo-400 to-indigo-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user, isDark, favoritesCount, placesCount, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const avatarColor = stringToColor(user.id);
  const initials = getInitials(user.name);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 ${
          isDark
            ? "border-neutral-700 bg-neutral-800/80 hover:border-neutral-600"
            : "border-neutral-200 bg-white hover:border-neutral-300 shadow-sm"
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xs shadow-sm shrink-0`}
        >
          {initials}
        </div>
        <span className={`hidden sm:block text-sm max-w-[100px] truncate ${isDark ? "text-neutral-200" : "text-neutral-700"}`}>
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isDark ? "text-neutral-400" : "text-neutral-500"} ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: -6 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className={`absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-xl border overflow-hidden z-[600] ${
              isDark
                ? "bg-neutral-900 border-neutral-800"
                : "bg-white border-neutral-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* User info header */}
            <div
              className={`px-4 py-4 border-b ${isDark ? "border-neutral-800 bg-neutral-800/50" : "border-neutral-100 bg-neutral-50"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white shadow-md shrink-0`}
                >
                  <span className="text-sm">{initials}</span>
                </div>
                <div className="min-w-0">
                  <div className={`truncate ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                    {user.name}
                  </div>
                  <div className={`text-xs truncate ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 flex gap-2">
                {/* Menampilkan Jumlah Favorit */}
                <div className={`flex-1 text-center py-2 rounded-xl ${isDark ? "bg-neutral-800" : "bg-white border border-neutral-200"}`}>
                  <div className={`text-sm font-bold ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                    {favoritesCount}
                  </div>
                  <div className={`text-[10px] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                    Favorit
                  </div>
                </div>

                {/* Menampilkan Jumlah Tempat (Ganti dari Status Aktif) */}
                <div className={`flex-1 text-center py-2 rounded-xl ${isDark ? "bg-neutral-800" : "bg-white border border-neutral-200"}`}>
                  <div className={`text-sm font-bold text-green-500`}>
                    {placesCount}
                  </div>
                  <div className={`text-[10px] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                    Tempat
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

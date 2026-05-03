import { Heart, MapPin, Star } from "lucide-react";
import { motion } from "motion/react";
import { CATEGORY_META, type Place } from "../data/places";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Props {
  place: Place;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (place: Place) => void;
}

export function PlaceCard({ place, isFavorite, onToggleFavorite, onSelect }: Props) {
  const meta = CATEGORY_META[place.category];
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-[var(--app-surface)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg cursor-pointer border border-neutral-100 dark:border-[var(--app-border)] transition-shadow"
      onClick={() => onSelect(place)}
    >
      <div className="relative h-40 overflow-hidden">
        <ImageWithFallback
          src={place.image}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(place.id); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/40 border border-transparent dark:border-[var(--app-border)] backdrop-blur-md flex items-center justify-center hover:bg-white dark:hover:bg-black/50 transition-colors shadow-md"
          aria-label="Toggle favorite"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${isFavorite ? "fill-orange-500 text-orange-500" : "text-neutral-700 dark:text-white/70"}`}
          />
        </button>
        <span
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs text-white backdrop-blur-md shadow-md"
          style={{ backgroundColor: meta.color }}
        >
          {meta.emoji} {meta.label}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-neutral-900 dark:text-white/90 line-clamp-1">{place.name}</h3>
          <div className="flex items-center gap-1 shrink-0 text-orange-500">
            <Star className="w-4 h-4 fill-orange-500" />
            <span className="text-sm">{place.rating}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-neutral-500 dark:text-white/55 text-sm mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span className="line-clamp-1">{place.region}</span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-white/65 line-clamp-2">{place.description}</p>
      </div>
    </motion.div>
  );
}

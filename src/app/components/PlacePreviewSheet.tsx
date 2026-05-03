import { Heart, MapPin, Share2, Star, X } from "lucide-react";
import { Drawer, DrawerContent } from "./ui/drawer";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Place } from "../data/places";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function PlacePreviewSheet({
  open,
  onOpenChange,
  place,
  isDark,
  isFavorite,
  onToggleFavorite,
  onMoreDetails,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  place: Place | null;
  isDark: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onMoreDetails: (id: string) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible>
      <DrawerContent
        className={clsx(
          "outline-none",
          isDark
            ? "bg-[#0b0f14] border-t border-white/10"
            : "bg-white border-t border-neutral-200",
        )}
      >
        {!place ? (
          <div className="p-6" />
        ) : (
          <div className="p-4 pb-6 max-w-3xl mx-auto w-full">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-[#11161d]">
                <ImageWithFallback src={place.image} alt={place.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={clsx("text-base font-semibold truncate", isDark ? "text-white/90" : "text-neutral-900")}>
                  {place.name}
                </div>
                <div className={clsx("mt-1 flex items-center gap-3 text-sm", isDark ? "text-white/60" : "text-neutral-600")}>
                  <span className="inline-flex items-center gap-1 text-orange-500">
                    <Star className="w-4 h-4 fill-orange-500" />
                    {place.rating}
                  </span>
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{place.region}</span>
                  </span>
                </div>
                <div className={clsx("mt-2 text-xs line-clamp-2", isDark ? "text-white/55" : "text-neutral-500")}>
                  {place.address}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isDark ? "bg-[#11161d] border border-white/10 text-white/80" : "bg-white border border-neutral-200 text-neutral-700",
                )}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onMoreDetails(place.id)}
                className={clsx(
                  "col-span-2 py-3 rounded-2xl font-semibold text-sm transition-colors",
                  isDark ? "bg-[#7fffd4] text-[#0b0f14] hover:bg-[#8fffe0]" : "bg-green-600 text-white hover:bg-green-700",
                )}
              >
                More details
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(place.id)}
                className={clsx(
                  "py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
                  isDark ? "bg-[#11161d] border-white/10 text-white/80 hover:text-white" : "bg-white border-neutral-200 text-neutral-700",
                )}
                aria-label="Save"
              >
                <Heart className={clsx("w-4 h-4", isFavorite ? "fill-orange-500 text-orange-500" : "")} />
                Save
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={clsx(
                  "py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2",
                  isDark ? "bg-[#11161d] border-white/10 text-white/75" : "bg-white border-neutral-200 text-neutral-700",
                )}
              >
                <MapPin className="w-4 h-4" />
                Directions
              </button>
              <button
                type="button"
                className={clsx(
                  "py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2",
                  isDark ? "bg-[#11161d] border-white/10 text-white/75" : "bg-white border-neutral-200 text-neutral-700",
                )}
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}


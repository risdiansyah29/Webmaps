// Data tempat wisata & kuliner Indonesia (dummy)
export type Category = "nature" | "cultural" | "traditional" | "modern";
import type { Review } from "../components/PlaceDetail";

export interface Place {
  id: string;
  name: string;
  category: Category;
  region: string;
  address: string;
  description: string;
  rating: number;
  image: string;
  lat: number;
  lng: number;
  tags: string[];
  reviews?: Review[];
}

export const CATEGORY_META: Record<Category, { label: string; color: string; emoji: string }> = {
  nature: { label: "Wisata Alam", color: "var(--cat-nature)", emoji: "🌿" },
  cultural: { label: "Wisata Budaya", color: "var(--cat-cultural)", emoji: "🏛️" },
  traditional: { label: "Kuliner Tradisional", color: "var(--cat-traditional)", emoji: "🍛" },
  modern: { label: "Kuliner Modern", color: "var(--cat-modern)", emoji: "🍽️" },
};

import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import LandingPage from "./pages/LandingPage";
import MapPage from "./pages/MapPage";
import PlaceDetailPage from "./pages/PlaceDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProfilePage from "./pages/ProfilePage";
import AppShell from "./layout/AppShell";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/discover" element={<LandingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/place/:id" element={<PlaceDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

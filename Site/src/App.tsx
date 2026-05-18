// Site/src/App.tsx

import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";

const Home = lazy(() => import("./pages/Home"));
const Anime = lazy(() => import("./pages/Anime"));
const Episode = lazy(() => import("./pages/Episode"));
const EpisodesPage = lazy(() => import("./pages/EpisodesPage"));
const NovosAnimesPage = lazy(() => import("./pages/NovosAnimesPage"));
const AnimesPage = lazy(() => import("./pages/AnimesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const CalendarioPage = lazy(() => import("./pages/CalendarioPage"));
const FavoritosPage = lazy(() => import("./pages/FavoritosPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteLoader() {
  return (
    <div className="container py-24">
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl skeleton-loading" />
        <div className="h-[32vh] rounded-[28px] skeleton-loading" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[3/4] rounded-2xl skeleton-loading" />
              <div className="h-4 rounded skeleton-loading" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Navbar />
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/animes" element={<AnimesPage />} />
              <Route path="/novosanimes" element={<NovosAnimesPage />} />
              <Route path="/episodios" element={<EpisodesPage />} />
              <Route path="/anime/:slug" element={<Anime />} />
              <Route path="/episodio/:slug/:episodeNumber" element={<Episode />} />
              <Route path="/calendario" element={<CalendarioPage />} />
              <Route path="/favoritos" element={<FavoritosPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <MobileBottomNav />
          <Footer />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

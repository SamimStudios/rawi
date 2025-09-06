import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import CinematicTeaser from "./pages/CinematicTeaser";
import Templates from "./pages/Templates";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import App from "./pages/App";

const queryClient = new QueryClient();

const MainApp = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/auth/sign-in" element={<SignIn />} />
                <Route path="/auth/sign-up" element={<SignUp />} />
                <Route path="/app" element={<App />} />
                <Route path="/" element={
                  <div>
                    <Header />
                    <Index />
                    <Footer />
                  </div>
                } />
                <Route path="/try/cinematic-teaser" element={
                  <div>
                    <Header />
                    <CinematicTeaser />
                    <Footer />
                  </div>
                } />
                <Route path="/templates" element={
                  <div>
                    <Header />
                    <Templates />
                    <Footer />
                  </div>
                } />
                <Route path="/help" element={
                  <div>
                    <Header />
                    <Help />
                    <Footer />
                  </div>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={
                  <div>
                    <Header />
                    <NotFound />
                    <Footer />
                  </div>
                } />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default MainApp;

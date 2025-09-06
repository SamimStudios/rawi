import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SEOProvider } from "@/contexts/SEOContext";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import CinematicTeaser from "./pages/CinematicTeaser";
import Templates from "./pages/Templates";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import I18nDemo from "./pages/I18nDemo";
import SEODemo from "./pages/SEODemo";
import ConfigDemo from "./pages/ConfigDemo";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import App from "./pages/App";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Consent from "./pages/legal/Consent";
import Dashboard from "./pages/app/Dashboard";
import History from "./pages/app/History";
import Wallet from "./pages/app/Wallet";
import Settings from "./pages/app/Settings";
import JobStatus from "./pages/app/JobStatus";
import Result from "./pages/app/Result";

const queryClient = new QueryClient();

const MainApp = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SEOProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <div className="min-h-screen bg-background">
                  <Routes>
                  <Route path="/auth/sign-in" element={<SignIn />} />
                  <Route path="/auth/sign-up" element={<SignUp />} />
                  <Route path="/404" element={
                    <div>
                      <Header />
                      <NotFound />
                      <Footer />
                    </div>
                  } />
                  <Route path="/500" element={
                    <div>
                      <Header />
                      <ServerError />
                      <Footer />
                    </div>
                  } />
                  <Route path="/app" element={
                    <div>
                      <Header />
                      <Dashboard />
                      <Footer />
                    </div>
                  } />
                  <Route path="/app/history" element={
                    <div>
                      <Header />
                      <History />
                      <Footer />
                    </div>
                  } />
                  <Route path="/app/wallet" element={
                    <div>
                      <Header />
                      <Wallet />
                      <Footer />
                    </div>
                  } />
                  <Route path="/app/settings" element={
                    <div>
                      <Header />
                      <Settings />
                      <Footer />
                    </div>
                  } />
                  <Route path="/app/jobs/:id" element={
                    <div>
                      <Header />
                      <JobStatus />
                      <Footer />
                    </div>
                  } />
                  <Route path="/app/results/:id" element={
                    <div>
                      <Header />
                      <Result />
                      <Footer />
                    </div>
                  } />
                  <Route path="/legal/terms" element={
                    <div>
                      <Header />
                      <Terms />
                      <Footer />
                    </div>
                  } />
                  <Route path="/legal/privacy" element={
                    <div>
                      <Header />
                      <Privacy />
                      <Footer />
                    </div>
                  } />
                  <Route path="/legal/consent" element={
                    <div>
                      <Header />
                      <Consent />
                      <Footer />
                    </div>
                  } />
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
                  <Route path="/i18n-demo" element={
                    <div>
                      <Header />
                      <I18nDemo />
                      <Footer />
                    </div>
                  } />
                  <Route path="/seo-demo" element={
                    <div>
                      <Header />
                      <SEODemo />
                      <Footer />
                    </div>
                  } />
                  <Route path="/config-demo" element={
                    <div>
                      <Header />
                      <ConfigDemo />
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
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </SEOProvider>
  </LanguageProvider>
</QueryClientProvider>
);

export default MainApp;

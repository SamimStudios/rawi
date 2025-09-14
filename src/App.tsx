import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SEOProvider } from "@/contexts/SEOContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { FunctionDataProvider } from "@/contexts/FunctionDataContext";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import CinematicTeaser from "./pages/CinematicTeaser";
import Templates from "./pages/Templates";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import I18nDemo from "./pages/I18nDemo";
import SEODemo from "./pages/SEODemo";
import ConfigDemo from "./pages/ConfigDemo";
import AnalyticsDemo from "./pages/AnalyticsDemo";
import MediaPlayerDemo from "./pages/MediaPlayerDemo";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ResetPassword from "./pages/auth/ResetPassword";
import App from "./pages/App";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Consent from "./pages/legal/Consent";
import Refund from "./pages/legal/Refund";
import Dashboard from "./pages/app/Dashboard";

import Wallet from "./pages/app/Wallet";
import Settings from "./pages/app/Settings";
import Result from "./pages/app/Result";
import StyleGuideline from "./pages/StyleGuideline";
import N8NTest from "./pages/N8NTest";
import ButtonShowcase from "./pages/ButtonShowcase";
import { NodeExplorer } from "@/node-explorer/pages/NodeExplorer";
import { NodesList } from "@/node-explorer/pages/NodesList";



const queryClient = new QueryClient();

const MainApp = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SEOProvider>
        <AnalyticsProvider>
          <FunctionDataProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <ErrorBoundary>
                  <div className="min-h-screen bg-background">
                    <Routes>
                   <Route path="/auth/sign-in" element={<SignIn />} />
                   <Route path="/auth/sign-up" element={<SignUp />} />
                   <Route path="/auth/reset-password" element={<ResetPassword />} />
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
                  <Route path="/legal/refund" element={
                    <div>
                      <Header />
                      <Refund />
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
                  <Route path="/analytics-demo" element={
                    <div>
                      <Header />
                      <AnalyticsDemo />
                      <Footer />
                    </div>
                  } />
                  <Route path="/media-player-demo" element={
                    <div>
                      <Header />
                      <MediaPlayerDemo />
                      <Footer />
                    </div>
                  } />
                  <Route path="/style-guideline" element={
                    <div>
                      <Header />
                      <StyleGuideline />
                      <Footer />
                    </div>
                  } />
                  <Route path="/n8n-test" element={
                    <div>
                      <Header />
                      <N8NTest />
                      <Footer />
                    </div>
                  } />
                  <Route path="/nodes/:id" element={<NodeExplorer />} />
                  <Route path="/nodes" element={<NodesList />} />
                   {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={
                    <div>
                      <Header />
                      <NotFound />
                      <Footer />
                    </div>
                  } />
                    </Routes>
                    <CookieConsent />
                  </div>
                </ErrorBoundary>
              </AuthProvider>
            </BrowserRouter>

            </TooltipProvider>
          </FunctionDataProvider>
        </AnalyticsProvider>
      </SEOProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default MainApp;

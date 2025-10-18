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
import Dashboard from '@/pages/app/Dashboard';
import AdminIndex from '@/pages/admin';
import AdminBuildIndex from '@/pages/admin/build';
import AdminDemoIndex from '@/pages/admin/demo';
import FieldRoutes from '@/pages/admin/build/field';
import NodeLibraryRoutes from '@/pages/admin/build/node';
import TemplateRoutes from '@/pages/admin/build/template';
import AppTemplates from '@/pages/app/Templates';
import JobRoutes from '@/pages/app/jobs';
import NodeRendererPreview from '@/pages/app/renderers/node';
import LtreeTesterPage from '@/pages/app/ltree';
import Usage from "@/pages/user/Usage";
import Billing from "@/pages/user/Billing";
import Settings from '@/pages/user/Settings';
import StyleGuideline from "./pages/StyleGuideline";
import ButtonShowcase from "./pages/ButtonShowcase";



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
                  <Route path="/app/templates" element={
                    <div>
                      <Header />
                      <AppTemplates />
                      <Footer />
                    </div>
                  } />
                  <Route path="/app/jobs/*" element={
                    <div>
                      <Header />
                      <JobRoutes />
                      <Footer />
                    </div>
                  } />
                  <Route path="/app/renderers/node" element={
                    <div>
                      <Header />
                      <NodeRendererPreview />
                      <Footer />
                    </div>
                  } />
                  <Route path="/app/ltree" element={
                    <div>
                      <Header />
                      <LtreeTesterPage />
                      <Footer />
                    </div>
                  } />
            <Route path="/user/usage" element={
              <div>
                <Header />
                <Usage />
                <Footer />
              </div>
            } />
            <Route path="/user/billing" element={
              <div>
                <Header />
                <Billing />
                <Footer />
              </div>
            } />
            {/* Legacy route redirect */}
            <Route path="/user/wallet" element={
              <div>
                <Header />
                <Usage />
                <Footer />
              </div>
            } />
                  <Route path="/user/settings" element={
                    <div>
                      <Header />
                      <Settings />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin" element={
                    <div>
                      <Header />
                      <AdminIndex />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/build" element={
                    <div>
                      <Header />
                      <AdminBuildIndex />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/build/field/*" element={
                    <div>
                      <Header />
                      <FieldRoutes />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/build/node/*" element={
                    <div>
                      <Header />
                      <NodeLibraryRoutes />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/build/template/*" element={
                    <div>
                      <Header />
                      <TemplateRoutes />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/demo" element={
                    <div>
                      <Header />
                      <AdminDemoIndex />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/demo/i18n" element={
                    <div>
                      <Header />
                      <I18nDemo />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/demo/seo" element={
                    <div>
                      <Header />
                      <SEODemo />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/demo/config" element={
                    <div>
                      <Header />
                      <ConfigDemo />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/demo/analytics" element={
                    <div>
                      <Header />
                      <AnalyticsDemo />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/demo/media-player" element={
                    <div>
                      <Header />
                      <MediaPlayerDemo />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/demo/style-guideline" element={
                    <div>
                      <Header />
                      <StyleGuideline />
                      <Footer />
                    </div>
                  } />
                  <Route path="/admin/demo/button-showcase" element={
                    <div>
                      <Header />
                      <ButtonShowcase />
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

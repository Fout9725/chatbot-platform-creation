
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OnboardingOverlay, { STORAGE_KEY as ONBOARDING_KEY } from "@/components/onboarding/OnboardingOverlay";
import { ActiveBotsProvider } from "./contexts/ActiveBotsContext";
import { BotStatsProvider } from "./contexts/BotStatsContext";
import { AuthProvider } from "./contexts/AuthContext";
import SessionExpiryNotification from "./components/SessionExpiryNotification";
import Index from "./pages/Index";
import BotDetails from "./pages/BotDetails";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Constructor from "./pages/Constructor";
import MyBotsPage from "./pages/MyBotsPage";
import Documentation from "./components/Documentation";
import NotFound from "./pages/NotFound";
import PlanSelection from "./pages/PlanSelection";
import Dashboard from "./pages/Dashboard";
import PartnerProgram from "./pages/PartnerProgram";
import Partner from "./pages/Partner";
import BotBuilder from "./pages/BotBuilder";
import Legal from "./pages/Legal";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Oferta from "./pages/Oferta";
import Admin from "./pages/Admin";
import AdminNew from "./pages/AdminNew";
import AIAssistant from "./components/AIAssistant";
import OfferConstructor from "./pages/OfferConstructor";
import PollWorkerTrigger from "./pages/PollWorkerTrigger";
import PollCronSetup from "./pages/PollCronSetup";
import InstagramAutomation from "./components/InstagramAutomation";
import AutomationHub from "./pages/AutomationHub";
import TelegramAutomation from "./components/TelegramAutomation";
import YouTubeAutomation from "./components/YouTubeAutomation";
import VKAutomation from "./components/VKAutomation";
import TikTokAutomation from "./components/TikTokAutomation";

const queryClient = new QueryClient();

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShowOnboarding(true);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ActiveBotsProvider>
        <BotStatsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <SessionExpiryNotification />
          {showOnboarding && (
            <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
          )}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bot/:id" element={<BotDetails />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/constructor" element={<Constructor />} />
          <Route path="/my-bots" element={<MyBotsPage />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/plan-selection" element={<PlanSelection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/partner-program" element={<PartnerProgram />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/bot-builder" element={<BotBuilder />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/oferta" element={<Oferta />} />
          <Route path="/admin" element={<AdminNew />} />
          <Route path="/admin-old" element={<Admin />} />
          <Route path="/offer-constructor" element={<OfferConstructor />} />
          <Route path="/poll-worker" element={<PollWorkerTrigger />} />
          <Route path="/poll-cron-setup" element={<PollCronSetup />} />
          <Route path="/automation-hub" element={<AutomationHub />} />
          <Route path="/instagram-automation" element={<InstagramAutomation />} />
          <Route path="/telegram-automation" element={<TelegramAutomation />} />
          <Route path="/youtube-automation" element={<YouTubeAutomation />} />
          <Route path="/vk-automation" element={<VKAutomation />} />
          <Route path="/tiktok-automation" element={<TikTokAutomation />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIAssistant />
        </BrowserRouter>
      </TooltipProvider>
        </BotStatsProvider>
      </ActiveBotsProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
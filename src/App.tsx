
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ActiveBotsProvider } from "./contexts/ActiveBotsContext";
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
import Admin from "./pages/Admin";
import AIAssistant from "./components/AIAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ActiveBotsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <SessionExpiryNotification />
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
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIAssistant />
        </BrowserRouter>
      </TooltipProvider>
      </ActiveBotsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
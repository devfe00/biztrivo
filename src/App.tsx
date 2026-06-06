import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Caixa from "@/pages/Caixa";
import Vitrine from "@/pages/Vitrine";
import PostsIA from "@/pages/PostsIA";
import Offline from "@/pages/Offline";
import Academy from "@/pages/Academy";
import Relatorios from "@/pages/Relatorios";
import MEI from "@/pages/MEI";
import Contador from "@/pages/Contador";
import Calculadora from "@/pages/Calculadora";
import PublicStore from "@/pages/PublicStore";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import Configuracoes from "@/pages/Configuracoes";
import Planos from "@/pages/Planos";
import TermosDeUso from "@/pages/TermosDeUso";
import PoliticaPrivacidade from "@/pages/PoliticaPrivacidade";
import NotFound from "./pages/NotFound";
import AuthCallback from "@/pages/AuthCallback";
import LandingPage from '@/pages/LandingPage';
import CookieBanner from "@/components/CookieBanner";

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/loja/:slug" element={<PublicStore />} />
              
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/caixa" element={<ProtectedRoute><AppLayout><Caixa /></AppLayout></ProtectedRoute>} />
              <Route path="/vitrine" element={<ProtectedRoute><AppLayout><Vitrine /></AppLayout></ProtectedRoute>} />
              <Route path="/posts-ia" element={<ProtectedRoute><AppLayout><PostsIA /></AppLayout></ProtectedRoute>} />
              <Route path="/offline" element={<ProtectedRoute><AppLayout><Offline /></AppLayout></ProtectedRoute>} />
              <Route path="/calculadora" element={<ProtectedRoute><AppLayout><Calculadora /></AppLayout></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><AppLayout><Relatorios /></AppLayout></ProtectedRoute>} />
              <Route path="/mei" element={<ProtectedRoute><AppLayout><MEI /></AppLayout></ProtectedRoute>} />
              <Route path="/contador" element={<ProtectedRoute><AppLayout><Contador /></AppLayout></ProtectedRoute>} />
              <Route path="/academy" element={<ProtectedRoute><AppLayout><Academy /></AppLayout></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><AppLayout><Configuracoes /></AppLayout></ProtectedRoute>} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieBanner />
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

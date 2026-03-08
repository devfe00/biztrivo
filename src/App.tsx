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
import Academy from "@/pages/Academy";
import Relatorios from "@/pages/Relatorios";
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

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/loja/:slug" element={<PublicStore />} />
              
              <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
              <Route path="/caixa" element={<ProtectedPage><Caixa /></ProtectedPage>} />
              <Route path="/vitrine" element={<ProtectedPage><Vitrine /></ProtectedPage>} />
              <Route path="/calculadora" element={<ProtectedPage><Calculadora /></ProtectedPage>} />
              <Route path="/relatorios" element={<ProtectedPage><Relatorios /></ProtectedPage>} />
              <Route path="/academy" element={<ProtectedPage><Academy /></ProtectedPage>} />
              <Route path="/configuracoes" element={<ProtectedPage><Configuracoes /></ProtectedPage>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

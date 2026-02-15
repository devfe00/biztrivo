import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/contexts/StoreContext";
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
import Configuracoes from "@/pages/Configuracoes";
import TermosDeUso from "@/pages/TermosDeUso";
import PoliticaPrivacidade from "@/pages/PoliticaPrivacidade";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/loja/:slug" element={<PublicStore />} />
            
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/caixa" element={<AppLayout><Caixa /></AppLayout>} />
            <Route path="/vitrine" element={<AppLayout><Vitrine /></AppLayout>} />
            <Route path="/calculadora" element={<AppLayout><Calculadora /></AppLayout>} />
            <Route path="/relatorios" element={<AppLayout><Relatorios /></AppLayout>} />
            <Route path="/academy" element={<AppLayout><Academy /></AppLayout>} />
            <Route path="/configuracoes" element={<AppLayout><Configuracoes /></AppLayout>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
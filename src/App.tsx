import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "./components/Header";
import Home from "./pages/Home";
import DepartmentView from "./pages/DepartmentView";
import DepartmentsList from "./pages/DepartmentsList";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAvisos from "./pages/admin/AdminAvisos";
import AdminConteudoHome from "./pages/admin/AdminConteudoHome";
import AdminDepartamentos from "./pages/admin/AdminDepartamentos";
import AdminSincronizar from "./pages/admin/AdminSincronizar";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin") && location.pathname !== "/admin/login";

  if (isAdmin) return <AdminLayout>{children}</AdminLayout>;

  return (
    <>
      <Header />
      {children}
    </>
  );
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/departamentos" element={<DepartmentsList />} />
      <Route path="/departamento/:slug" element={<DepartmentView />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/avisos" element={<AdminAvisos />} />
      <Route path="/admin/conteudo-home" element={<AdminConteudoHome />} />
      <Route path="/admin/departamentos" element={<AdminDepartamentos />} />
      <Route path="/admin/sincronizar" element={<AdminSincronizar />} />
      <Route path="/admin/usuarios" element={<AdminUsuarios />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

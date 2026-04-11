import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "./components/Header";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages públicas
import Home from "./pages/Home";
import DepartmentView from "./pages/DepartmentView";
import DepartmentsList from "./pages/DepartmentsList";
import DepartmentDetail from "./pages/DepartmentDetail";
import NotFound from "./pages/NotFound";

// Pages admin
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAvisos from "./pages/admin/AdminAvisos";
import AdminConteudoHome from "./pages/admin/AdminConteudoHome";
import AdminDepartamentos from "./pages/admin/AdminDepartamentos";
import AdminSincronizar from "./pages/admin/AdminSincronizar";
import AdminUsuarios from "./pages/admin/AdminUsuarios";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/admin/login";

  return (
    <>
      {/* Header público só aparece fora do admin */}
      {!isAdminArea && <Header />}

      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/departamentos" element={<DepartmentsList />} />
        <Route path="/departamentos/:slug" element={<DepartmentDetail />} />

        {/* Login (sem proteção, sem AdminLayout) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Rotas Admin — protegidas + com AdminLayout */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/avisos" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminAvisos />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/conteudo-home" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminConteudoHome />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/departamentos" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminDepartamentos />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/sincronizar" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminSincronizar />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/usuarios" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminUsuarios />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

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
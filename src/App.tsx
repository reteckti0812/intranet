import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "./components/Header";
import AdminLayout from "./components/admin/AdminLayout";
import { RequireAuth, RequireAdmin } from "./components/ProtectedRoute";

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
import AdminDocumentos from "./pages/admin/AdminDocumentos";
import AdminISO from "./pages/admin/AdminISO";
import AdminAuditoria from "./pages/admin/AdminAuditoria";
import AdminUsuarios from "./pages/admin/AdminUsuarios";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/admin/login" || location.pathname === "/login";

  return (
    <>
      {/* Header público só aparece fora do admin e fora do login */}
      {!isAdminArea && !isLoginPage && <Header />}

      <Routes>
        {/* Login (sem proteção, sem AdminLayout) */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Rotas Públicas — exigem login (site inteiro protegido) */}
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/departamentos" element={<RequireAuth><DepartmentsList /></RequireAuth>} />
        <Route path="/departamentos/:slug" element={<RequireAuth><DepartmentDetail /></RequireAuth>} />

        {/* Rotas Admin — protegidas + com AdminLayout */}
        <Route path="/admin" element={
          <RequireAdmin>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/avisos" element={
          <RequireAdmin>
            <AdminLayout>
              <AdminAvisos />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/conteudo-home" element={
          <RequireAdmin>
            <AdminLayout>
              <AdminConteudoHome />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/departamentos" element={
          <RequireAdmin>
            <AdminLayout>
              <AdminDepartamentos />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/documentos" element={
          <RequireAdmin>
            <AdminLayout>
              <AdminDocumentos />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/iso" element={
          <RequireAdmin>
            <AdminLayout>
              <AdminISO />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/auditoria" element={
          <RequireAdmin>
            <AdminLayout>
              <AdminAuditoria />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/usuarios" element={
          <RequireAdmin>
            <AdminLayout>
              <AdminUsuarios />
            </AdminLayout>
          </RequireAdmin>
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
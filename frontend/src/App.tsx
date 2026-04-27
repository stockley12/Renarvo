import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./i18n";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/store/app";
import { useSession } from "@/store/session";
import { bootstrapSession } from "@/lib/bootstrap";
import { tokenStore } from "@/lib/tokenStore";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { CompanyLayout } from "@/components/layout/CompanyLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

import Home from "@/pages/public/Home";
import Cars from "@/pages/public/Cars";
import CarDetail from "@/pages/public/CarDetail";
import Booking from "@/pages/public/Booking";
import Companies from "@/pages/public/Companies";
import CompanyDetail from "@/pages/public/CompanyDetail";
import { About, HowItWorks, ForCompanies, Help, Contact, Terms, Privacy } from "@/pages/public/Static";
import { Login, ForgotPassword, ResetPassword } from "@/pages/auth/Auth";
import Register from "@/pages/auth/Register";
import RegisterCompany from "@/pages/auth/RegisterCompany";
import NotFound from "@/pages/NotFound";

import DashOverview from "@/pages/dashboard/Overview";
import DashFleet from "@/pages/dashboard/Fleet";
import DashReservations from "@/pages/dashboard/Reservations";
import DashStats from "@/pages/dashboard/Statistics";
import { DashCustomers, DashBranches, DashStaff, DashReviews, DashPayouts, DashDocuments, DashSettings } from "@/pages/dashboard/Sections";
import { DashCalendar, DashPricing, DashMessages, DashIntegrations } from "@/pages/dashboard/Extra";

import { AdminOverview, AdminCompanies, AdminApprovals, AdminCatalog, AdminReservations, AdminUsers, AdminReviews, AdminContent, AdminFinance, AdminSettings } from "@/pages/admin/Sections";
import { AdminAuditLog, AdminRisk, AdminNotifications, AdminSystem } from "@/pages/admin/Extra";

const queryClient = new QueryClient();

function I18nSync() {
  const { locale } = useApp();
  const { i18n } = useTranslation();
  useEffect(() => { if (i18n.language !== locale) i18n.changeLanguage(locale); }, [locale, i18n]);
  return null;
}

function SessionBootstrap() {
  const setUser = useSession((s) => s.setUser);
  const setLoading = useSession((s) => s.setLoading);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    bootstrapSession()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const onLogout = () => {
      tokenStore.clear();
      setUser(null);
    };
    window.addEventListener('renarvo:logout', onLogout);

    return () => {
      cancelled = true;
      window.removeEventListener('renarvo:logout', onLogout);
    };
  }, [setUser, setLoading]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <I18nSync />
        <SessionBootstrap />
        <Routes>
          {/* Legacy demo route, now permanently redirected. */}
          <Route path="/demo" element={<Navigate to="/" replace />} />

          {/* Public site */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetail />} />
            <Route path="/book/:id" element={<Booking />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:slug" element={<CompanyDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/for-companies" element={<ForCompanies />} />
            <Route path="/help" element={<Help />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-company" element={<RegisterCompany />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Company dashboard (company_owner | company_staff) */}
          <Route element={<ProtectedRoute allow={['company_owner', 'company_staff']} />}>
            <Route path="/dashboard" element={<CompanyLayout />}>
              <Route index element={<DashOverview />} />
              <Route path="calendar" element={<DashCalendar />} />
              <Route path="cars" element={<DashFleet />} />
              <Route path="reservations" element={<DashReservations />} />
              <Route path="messages" element={<DashMessages />} />
              <Route path="customers" element={<DashCustomers />} />
              <Route path="statistics" element={<DashStats />} />
              <Route path="branches" element={<DashBranches />} />
              <Route path="staff" element={<DashStaff />} />
              <Route path="reviews" element={<DashReviews />} />
              <Route path="pricing" element={<DashPricing />} />
              <Route path="payouts" element={<DashPayouts />} />
              <Route path="documents" element={<DashDocuments />} />
              <Route path="integrations" element={<DashIntegrations />} />
              <Route path="settings" element={<DashSettings />} />
            </Route>
          </Route>

          {/* Super admin (superadmin only) */}
          <Route element={<ProtectedRoute allow={['superadmin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="catalog" element={<AdminCatalog />} />
              <Route path="reservations" element={<AdminReservations />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="risk" element={<AdminRisk />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="audit" element={<AdminAuditLog />} />
              <Route path="system" element={<AdminSystem />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

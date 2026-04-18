import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useComingSoonFlags } from "@/hooks/useComingSoon";
import { useAdmin } from "@/hooks/useAdmin";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart";
import ScrollToTop from "@/components/ScrollToTop";
import SkipNav from "@/components/SkipNav";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import MobileBottomNav from "@/components/MobileBottomNav";
import AnnouncementBar, { useAnnouncementHeight } from "@/components/AnnouncementBar";
import AnnouncementEngine, { useAnnouncementEngineBarHeight } from "@/components/AnnouncementEngine";
import { subscribeToAllChanges } from "@/lib/realtime";
import { usePageTracking } from "@/hooks/usePageTracking";

import HomePage from "@/pages/HomePage";
import BundlesPage from "@/pages/BundlesPage";
import BundleDetailPage from "@/pages/BundleDetailPage";
import ShopPage from "@/pages/ShopPage";
import QuizPage from "@/pages/QuizPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderConfirmedPage from "@/pages/OrderConfirmedPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import CookiesPage from "@/pages/CookiesPage";
import ReturnsPage from "@/pages/ReturnsPage";
import BlogPage from "@/pages/BlogPage";
import TrackOrderPage from "@/pages/TrackOrderPage";
import PushGiftsPage from "@/pages/PushGiftsPage";
import ProductPage from "@/pages/ProductPage";
import DynamicPage from "@/pages/DynamicPage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import NotFound from "./pages/NotFound.tsx";

// Admin
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminBundles from "@/pages/admin/AdminBundles";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminDelivery from "@/pages/admin/AdminDelivery";
import AdminContent from "@/pages/admin/AdminContent";
import AdminBlog from "@/pages/admin/AdminBlog";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminReferrals from "@/pages/admin/AdminReferrals";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminMedia from "@/pages/admin/AdminMedia";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminShippingZones from "@/pages/admin/AdminShippingZones";
import AdminPages from "@/pages/admin/AdminPages";
import AdminPromotions from "@/pages/admin/AdminPromotions";
import AdminQuizLeads from "@/pages/admin/AdminQuizLeads";
import AdminQuizEngine from "@/pages/admin/AdminQuizEngine";
import AdminEmailTemplates from "@/pages/admin/AdminEmailTemplates";
import AdminComingSoon from "@/pages/admin/AdminComingSoon";
import PermissionGate from "@/components/admin/PermissionGate";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
});

function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  useEffect(() => {
    const unsub = subscribeToAllChanges((_table, keys) => {
      keys.forEach(key => qc.invalidateQueries({ queryKey: [key] }));
    });
    return unsub;
  }, [qc]);
  return <>{children}</>;
}

function PageTracker({ children }: { children: React.ReactNode }) {
  usePageTracking();
  return <>{children}</>;
}

/**
 * Redirects storefront traffic to /coming-soon when both flags are on.
 * Admin sessions (logged-in Supabase users) bypass the redirect so they
 * can still preview the live site. /admin/* routes are excluded by
 * design — they're mounted as siblings of <StorefrontShell />.
 */
function ComingSoonGate({ children }: { children: React.ReactNode }) {
  const { data: flags } = useComingSoonFlags();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  // Don't redirect the coming-soon page itself
  if (location.pathname === "/coming-soon") return <>{children}</>;

  // While auth is still resolving, render nothing to avoid a flash redirect
  if (adminLoading) return null;

  const shouldRedirect =
    flags?.enabled === true &&
    flags?.redirectAll === true &&
    !isAdmin;

  if (shouldRedirect) return <Navigate to="/coming-soon" replace />;
  return <>{children}</>;
}

function StorefrontShell() {
  const { height: legacyBarHeight, dismissed, setDismissed } = useAnnouncementHeight();
  const engineBarHeight = useAnnouncementEngineBarHeight();
  const totalBarHeight = legacyBarHeight + engineBarHeight;
  return (
    <>
      <SkipNav />
      <AnnouncementBar dismissed={dismissed} onDismiss={() => setDismissed(true)} />
      <AnnouncementEngine topOffset={legacyBarHeight} />
      <Navbar topOffset={totalBarHeight} />
      <main id="main-content">
        {totalBarHeight > 0 && <div style={{ height: totalBarHeight }} className="transition-all duration-300" />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bundles" element={<BundlesPage />} />
          <Route path="/bundles/:bundleId" element={<BundleDetailPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmed" element={<OrderConfirmedPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/push-gifts" element={<PushGiftsPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/p/:slug" element={<DynamicPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RealtimeProvider>
      <TooltipProvider>
        <CartProvider>
          <Sonner />
          <BrowserRouter>
            <PageTracker>
            <ScrollToTop />
            <Routes>
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<PermissionGate module="dashboard" action="view"><AdminDashboard /></PermissionGate>} />
                <Route path="products" element={<PermissionGate module="products" action="view"><AdminProducts /></PermissionGate>} />
                <Route path="bundles" element={<PermissionGate module="products" action="view"><AdminBundles /></PermissionGate>} />
                <Route path="orders" element={<PermissionGate module="orders" action="view"><AdminOrders /></PermissionGate>} />
                <Route path="delivery" element={<PermissionGate module="delivery" action="view"><AdminDelivery /></PermissionGate>} />
                <Route path="content" element={<PermissionGate module="content" action="view"><AdminContent /></PermissionGate>} />
                <Route path="blog" element={<PermissionGate module="content" action="view"><AdminBlog /></PermissionGate>} />
                <Route path="settings" element={<PermissionGate module="content" action="edit_settings"><AdminSettings /></PermissionGate>} />
                <Route path="referrals" element={<PermissionGate module="customers" action="view"><AdminReferrals /></PermissionGate>} />
                <Route path="analytics" element={<PermissionGate module="analytics" action="view"><AdminAnalytics /></PermissionGate>} />
                <Route path="users" element={<PermissionGate module="admin" action="view_users"><AdminUsers /></PermissionGate>} />
                <Route path="media" element={<PermissionGate module="content" action="view"><AdminMedia /></PermissionGate>} />
                <Route path="coupons" element={<PermissionGate module="coupons" action="view"><AdminCoupons /></PermissionGate>} />
                <Route path="customers" element={<PermissionGate module="customers" action="view"><AdminCustomers /></PermissionGate>} />
                <Route path="inventory" element={<PermissionGate module="inventory" action="view"><AdminInventory /></PermissionGate>} />
                <Route path="shipping-zones" element={<PermissionGate module="delivery" action="view"><AdminShippingZones /></PermissionGate>} />
                <Route path="pages" element={<PermissionGate module="content" action="view"><AdminPages /></PermissionGate>} />
                <Route path="promotions" element={<PermissionGate module="promotions" action="view"><AdminPromotions /></PermissionGate>} />
                <Route path="quiz-leads" element={<PermissionGate module="content" action="manage_quiz"><AdminQuizLeads /></PermissionGate>} />
                <Route path="quiz-engine" element={<PermissionGate module="content" action="manage_quiz"><AdminQuizEngine /></PermissionGate>} />
                <Route path="email-templates" element={<PermissionGate module="content" action="edit_settings"><AdminEmailTemplates /></PermissionGate>} />
                <Route path="coming-soon" element={<PermissionGate module="settings" action="manage_coming_soon"><AdminComingSoon /></PermissionGate>} />
              </Route>

              {/* Standalone public page — no navbar/footer, not redirected */}
              <Route path="/coming-soon" element={<ComingSoonPage />} />

              {/* Storefront routes (wrapped in Coming Soon redirect gate) */}
              <Route path="*" element={<ComingSoonGate><StorefrontShell /></ComingSoonGate>} />
            </Routes>
            </PageTracker>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </RealtimeProvider>
  </QueryClientProvider>
);

export default App;

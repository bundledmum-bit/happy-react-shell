import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart";
import ScrollToTop from "@/components/ScrollToTop";
import SkipNav from "@/components/SkipNav";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCartBar from "@/components/FloatingCartBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { subscribeToAllChanges } from "@/lib/realtime";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RealtimeProvider>
      <TooltipProvider>
        <CartProvider>
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="bundles" element={<AdminBundles />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="delivery" element={<AdminDelivery />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="referrals" element={<AdminReferrals />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="media" element={<AdminMedia />} />
              </Route>

              {/* Storefront routes */}
              <Route path="*" element={
                <>
                  <SkipNav />
                  <Navbar />
                  <main id="main-content">
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
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                  <FloatingCartBar />
                  <MobileBottomNav />
                </>
              } />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </RealtimeProvider>
  </QueryClientProvider>
);

export default App;

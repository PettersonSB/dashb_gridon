import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import Toaster from "@/components/ui/Toaster";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Login from "@/pages/Login";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages — each one is split into its own chunk
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const HeroEditor = React.lazy(() => import("@/pages/HeroEditor"));
const ProblemsEditor = React.lazy(() => import("@/pages/ProblemsEditor"));
const ServicesEditor = React.lazy(() => import("@/pages/ServicesEditor"));
const StatsEditor = React.lazy(() => import("@/pages/StatsEditor"));
const TestimonialsEditor = React.lazy(() => import("@/pages/TestimonialsEditor"));
const BlogManager = React.lazy(() => import("@/pages/BlogManager"));
const BlogEditor = React.lazy(() => import("@/pages/BlogEditor"));
const CompanyInfo = React.lazy(() => import("@/pages/CompanyInfo"));
const SeoConfig = React.lazy(() => import("@/pages/SeoConfig"));
const BudgetOverview = React.lazy(() => import("@/pages/BudgetOverview"));
const BudgetList = React.lazy(() => import("@/pages/BudgetList"));
const BudgetKits = React.lazy(() => import("@/pages/BudgetKits"));
const NewBudget = React.lazy(() => import("@/pages/NewBudget"));
const BudgetPreview = React.lazy(() => import("@/pages/BudgetPreview"));
const Settings = React.lazy(() => import("@/pages/Settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute — prevents excessive refetches on tab switches
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/hero" element={<HeroEditor />} />
                  <Route path="/problems" element={<ProblemsEditor />} />
                  <Route path="/services" element={<ServicesEditor />} />
                  <Route path="/stats" element={<StatsEditor />} />
                  <Route path="/testimonials" element={<TestimonialsEditor />} />
                  <Route path="/blog" element={<BlogManager />} />
                  <Route path="/blog/new" element={<BlogEditor />} />
                  <Route path="/blog/edit/:id" element={<BlogEditor />} />
                  <Route path="/company" element={<CompanyInfo />} />
                  <Route path="/seo" element={<SeoConfig />} />
                  <Route path="/budget" element={<BudgetOverview />} />
                  <Route path="/budget/list" element={<BudgetList />} />
                  <Route path="/budget/new" element={<NewBudget />} />
                  <Route path="/budget/edit/:id" element={<NewBudget />} />
                  <Route path="/budget/preview/:id" element={<BudgetPreview />} />
                  <Route path="/budget/kits" element={<BudgetKits />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <ConfirmDialog />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import HeroEditor from "@/pages/HeroEditor";
import ProblemsEditor from "@/pages/ProblemsEditor";
import ServicesEditor from "@/pages/ServicesEditor";
import StatsEditor from "@/pages/StatsEditor";
import TestimonialsEditor from "@/pages/TestimonialsEditor";
import BlogManager from "@/pages/BlogManager";
import BlogEditor from "@/pages/BlogEditor";
import CompanyInfo from "@/pages/CompanyInfo";
import SeoConfig from "@/pages/SeoConfig";
import BudgetOverview from "@/pages/BudgetOverview";
import BudgetList from "@/pages/BudgetList";
import BudgetKits from "@/pages/BudgetKits";
import NewBudget from "@/pages/NewBudget";
import BudgetPreview from "@/pages/BudgetPreview";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

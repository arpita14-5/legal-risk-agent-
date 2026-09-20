import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ContractsPage } from './pages/ContractsPage.js';
import { ContractAnalysisPage } from './pages/ContractAnalysisPage.js';
import { ContractComparisonPage } from './pages/ContractComparisonPage.js';
import { LegalKnowledgePage } from './pages/LegalKnowledgePage.js';
import { ObservabilityPage } from './pages/ObservabilityPage.js';
import { GlobalSearchPage } from './pages/GlobalSearchPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5
    }
  }
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-amber-400 text-xs font-mono">
        Verifying security credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contracts"
                  element={
                    <ProtectedRoute>
                      <ContractsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contracts/:id"
                  element={
                    <ProtectedRoute>
                      <ContractAnalysisPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/compare"
                  element={
                    <ProtectedRoute>
                      <ContractComparisonPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/legal-sources"
                  element={<LegalKnowledgePage />}
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <GlobalSearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/monitoring"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ObservabilityPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
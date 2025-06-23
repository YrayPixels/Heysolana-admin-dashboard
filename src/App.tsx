import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import UserDistribution from "./pages/UserDistribution";
import WaitlistPage from "./pages/WaitlistPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

// Protected route component that uses AuthContext
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn, isLoading, needsVerification } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If user needs verification, redirect to sign in
  if (needsVerification) {
    return <Navigate to="/" replace />;
  }

  // If not authenticated, redirect to sign in
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App routes component that uses AuthContext
const AppRoutes = () => {
  const { isLoggedIn, isLoading, needsVerification } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn && !needsVerification ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <SignIn />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-distribution"
        element={
          <ProtectedRoute>
            <UserDistribution />
          </ProtectedRoute>
        }
      />

      <Route
        path="/waitlist"
        element={
          <ProtectedRoute>
            <WaitlistPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ConfirmProvider } from "./components/ConfirmDialog";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import UserDistribution from "./pages/UserDistribution";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import ProfilePage from "./pages/ProfilePage";
import Orders from "./pages/Orders";
import Transactions from "./pages/Transactions";
import TransactionList from "./pages/TransactionList";
import TransactionDetail from "./pages/TransactionDetail";
import JumiaOrderDetail from "./pages/JumiaOrderDetail";
import CrossmintOrderDetail from "./pages/CrossmintOrderDetail";
import ChowdeckOrderDetail from "./pages/ChowdeckOrderDetail";
import Settings from "./pages/Settings";
import Admins from "./pages/Admins";
import Merchants from "./pages/Merchants";
import PushNotifications from "./pages/PushNotifications";
import PushQueue from "./pages/PushQueue";
import PushCampaignDetail from "./pages/PushCampaignDetail";
import ScheduledPushes from "./pages/ScheduledPushes";
import ScheduledPushDetail from "./pages/ScheduledPushDetail";
import NotificationNudges from "./pages/NotificationNudges";
import NotificationNudgeDetail from "./pages/NotificationNudgeDetail";
import Apps from "./pages/Apps";
import AppDetail from "./pages/AppDetail";
import WhatsAppMessaging from "./pages/WhatsAppMessaging";
import WhatsAppCampaignDetail from "./pages/WhatsAppCampaignDetail";
import EmailMessaging from "./pages/EmailMessaging";
import EmailCampaignDetail from "./pages/EmailCampaignDetail";
import BugReports from "./pages/BugReports";
import BugReportDetail from "./pages/BugReportDetail";
import SupportInbox from "./pages/SupportInbox";
import SupportConversationDetail from "./pages/SupportConversationDetail";
import NotFound from "./pages/NotFound";
import { isMerchantMode } from "./lib/appMode";
import {
  MerchantAuthProvider,
  useMerchantAuth,
} from "./merchant/MerchantAuthContext";
import MerchantSignIn from "./merchant/pages/MerchantSignIn";
import MerchantDashboard from "./merchant/pages/MerchantDashboard";
import MerchantOrders from "./merchant/pages/MerchantOrders";
import MerchantOrderDetail from "./merchant/pages/MerchantOrderDetail";
import MerchantRates from "./merchant/pages/MerchantRates";
import MerchantAssets from "./merchant/pages/MerchantAssets";
import MerchantWallets from "./merchant/pages/MerchantWallets";
import MerchantProfile from "./merchant/pages/MerchantProfile";

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn, isLoading, needsVerification } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (needsVerification) {
    return <Navigate to="/" replace />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const MerchantProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn, isLoading } = useMerchantAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isLoggedIn, isLoading, needsVerification } = useAuth();

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
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users/:id"
        element={
          <ProtectedRoute>
            <UserDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders/jumia/:orderId"
        element={
          <ProtectedRoute>
            <JumiaOrderDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders/crossmint/:orderId"
        element={
          <ProtectedRoute>
            <CrossmintOrderDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders/chowdeck/:orderId"
        element={
          <ProtectedRoute>
            <ChowdeckOrderDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transaction-list"
        element={
          <ProtectedRoute>
            <TransactionList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transaction-list/:id"
        element={
          <ProtectedRoute>
            <TransactionDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admins"
        element={
          <ProtectedRoute>
            <Admins />
          </ProtectedRoute>
        }
      />

      <Route
        path="/merchants"
        element={
          <ProtectedRoute>
            <Merchants />
          </ProtectedRoute>
        }
      />

      <Route
        path="/push-notifications"
        element={
          <ProtectedRoute>
            <PushNotifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/push-notifications/:id"
        element={
          <ProtectedRoute>
            <PushCampaignDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/push-queue"
        element={
          <ProtectedRoute>
            <PushQueue />
          </ProtectedRoute>
        }
      />

      <Route
        path="/scheduled-pushes"
        element={
          <ProtectedRoute>
            <ScheduledPushes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/scheduled-pushes/:id"
        element={
          <ProtectedRoute>
            <ScheduledPushDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notification-nudges"
        element={
          <ProtectedRoute>
            <NotificationNudges />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notification-nudges/:id"
        element={
          <ProtectedRoute>
            <NotificationNudgeDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/apps"
        element={
          <ProtectedRoute>
            <Apps />
          </ProtectedRoute>
        }
      />

      <Route
        path="/apps/:id"
        element={
          <ProtectedRoute>
            <AppDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/whatsapp-messaging"
        element={
          <ProtectedRoute>
            <WhatsAppMessaging />
          </ProtectedRoute>
        }
      />

      <Route
        path="/whatsapp-messaging/:id"
        element={
          <ProtectedRoute>
            <WhatsAppCampaignDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/email-messaging"
        element={
          <ProtectedRoute>
            <EmailMessaging />
          </ProtectedRoute>
        }
      />

      <Route
        path="/email-messaging/:id"
        element={
          <ProtectedRoute>
            <EmailCampaignDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bug-reports"
        element={
          <ProtectedRoute>
            <BugReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bug-reports/:id"
        element={
          <ProtectedRoute>
            <BugReportDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <SupportInbox />
          </ProtectedRoute>
        }
      />

      <Route
        path="/support/:id"
        element={
          <ProtectedRoute>
            <SupportConversationDetail />
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

const MerchantRoutes = () => {
  const { isLoggedIn, isLoading } = useMerchantAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <MerchantSignIn />}
      />
      <Route
        path="/dashboard"
        element={
          <MerchantProtectedRoute>
            <MerchantDashboard />
          </MerchantProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <MerchantProtectedRoute>
            <MerchantOrders />
          </MerchantProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <MerchantProtectedRoute>
            <MerchantOrderDetail />
          </MerchantProtectedRoute>
        }
      />
      <Route
        path="/rates"
        element={
          <MerchantProtectedRoute>
            <MerchantRates />
          </MerchantProtectedRoute>
        }
      />
      <Route
        path="/assets"
        element={
          <MerchantProtectedRoute>
            <MerchantAssets />
          </MerchantProtectedRoute>
        }
      />
      <Route
        path="/wallets"
        element={
          <MerchantProtectedRoute>
            <MerchantWallets />
          </MerchantProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <MerchantProtectedRoute>
            <MerchantProfile />
          </MerchantProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AdminApp = () => (
  <AuthProvider>
    <ConfirmProvider>
      <AppRoutes />
    </ConfirmProvider>
  </AuthProvider>
);

const MerchantApp = () => (
  <MerchantAuthProvider>
    <MerchantRoutes />
  </MerchantAuthProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {isMerchantMode() ? <MerchantApp /> : <AdminApp />}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

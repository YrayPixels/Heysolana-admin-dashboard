
import React, { useEffect, useState } from 'react';
import {
  AppWindow,
  BarChart3,
  Bell,
  Bug,
  CalendarClock,
  ChevronFirst,
  ChevronLast,
  Headphones,
  ListOrdered,
  LogOut,
  Menu,
  MessageCircle,
  Mail,
  Megaphone,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  Store,
  User,
  Users,
  X,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminNotificationBell from "@/components/AdminNotificationBell";

const BRAND_LOGO = "/logo.png";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", icon: <BarChart3 className="h-5 w-5" />, path: "/dashboard" },
      { name: "Analytics", icon: <TrendingUp className="h-5 w-5" />, path: "/analytics" },
      { name: "User Distribution", icon: <Users className="h-5 w-5" />, path: "/user-distribution" },
    ],
  },
  {
    label: "Users & Access",
    items: [
      { name: "Users", icon: <Users className="h-5 w-5" />, path: "/users" },
      { name: "Admin users", icon: <ShieldCheck className="h-5 w-5" />, path: "/admins" },
      { name: "Merchants", icon: <Store className="h-5 w-5" />, path: "/merchants" },
    ],
  },
  {
    label: "Messaging",
    items: [
      { name: "Push notifications", icon: <Bell className="h-5 w-5" />, path: "/push-notifications" },
      { name: "Push queue", icon: <ListOrdered className="h-5 w-5" />, path: "/push-queue" },
      { name: "Scheduled pushes", icon: <CalendarClock className="h-5 w-5" />, path: "/scheduled-pushes" },
      { name: "Notification nudges", icon: <Megaphone className="h-5 w-5" />, path: "/notification-nudges" },
      { name: "WhatsApp messaging", icon: <MessageCircle className="h-5 w-5" />, path: "/whatsapp-messaging" },
      { name: "Email messaging", icon: <Mail className="h-5 w-5" />, path: "/email-messaging" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { name: "Orders", icon: <Package className="h-5 w-5" />, path: "/orders" },
      { name: "Apps", icon: <AppWindow className="h-5 w-5" />, path: "/apps" },
      { name: "Transaction Analysis", icon: <TrendingUp className="h-5 w-5" />, path: "/transactions" },
      { name: "Transaction List", icon: <ReceiptText className="h-5 w-5" />, path: "/transaction-list" },
    ],
  },
  {
    label: "Support",
    items: [
      { name: "Support inbox", icon: <Headphones className="h-5 w-5" />, path: "/support" },
      { name: "Bugs & Logs", icon: <Bug className="h-5 w-5" />, path: "/bug-reports" },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", icon: <Settings className="h-5 w-5" />, path: "/settings" },
      { name: "Profile", icon: <User className="h-5 w-5" />, path: "/profile" },
    ],
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const renderNavGroups = ({
    showLabels,
    onNavigate,
  }: {
    showLabels: boolean;
    onNavigate?: () => void;
  }) => (
    <div className="space-y-4 px-2 pb-2">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {showLabels ? (
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
          ) : (
            <div
              className="mx-auto mb-1.5 h-px w-6 bg-white/10"
              aria-hidden="true"
              title={group.label}
            />
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.path}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className={cn(
                    "h-9 w-full justify-start gap-3",
                    !showLabels && "justify-center px-0",
                    isActive(item.path) && "bg-white/5"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    onNavigate?.();
                  }}
                  title={!showLabels ? item.name : undefined}
                >
                  {item.icon}
                  {showLabels && <span className="truncate">{item.name}</span>}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background bg-noise">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300 glass-morphism z-10",
          expanded ? "w-64" : "w-20"
        )}
      >
        <div className="flex shrink-0 items-center justify-between p-4">
          <div
            className={cn(
              "flex items-center",
              !expanded && "justify-center w-full"
            )}
          >
            {expanded ? (
              <div className="flex items-center gap-2">
                <img src={BRAND_LOGO} width={40} height={40} alt="HeySolana" />
                <span className="font-bold text-xl text-gradient-solana">
                  HeySolana
                </span>
              </div>
            ) : (
              <img src={BRAND_LOGO} width={40} height={40} alt="HeySolana" />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn("h-8 w-8", !expanded && "hidden")}
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn("h-8 w-8", expanded && "hidden")}
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto py-4 overscroll-y-contain">
          {renderNavGroups({ showLabels: expanded })}
        </nav>

        <div className="mt-auto shrink-0 border-t border-white/5 p-4">
          <div
            className={cn("flex items-center", !expanded && "justify-center")}
          >
            <Avatar className="h-8 w-8 mr-2 border border-white/10">
              <AvatarImage src="" alt={user?.name} />
              <AvatarFallback className="bg-solana/20">
                {user?.name ? getInitials(user.name) : "AD"}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn("flex-1 transition-opacity", !expanded && "hidden")}
            >
              <p className="text-sm font-medium">
                {user?.name || "Admin User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email || "admin@example.com"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className={cn("h-8 w-8 ml-auto", !expanded && "hidden")}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(18rem,85vw)] max-w-full flex-col overflow-hidden glass-morphism transform transition-transform duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 p-4">
          <div className="flex min-w-0 items-center gap-2">
            <img src={BRAND_LOGO} width={32} height={32} alt="HeySolana" className="shrink-0" />
            <span className="truncate font-bold text-xl text-gradient-solana">
              HeySolana
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-3 [-webkit-overflow-scrolling:touch]">
          {renderNavGroups({
            showLabels: true,
            onNavigate: toggleMobileMenu,
          })}
        </nav>

        <div className="shrink-0 border-t border-white/5 bg-black/20 p-4">
          <div className="flex min-w-0 items-center">
            <Avatar className="mr-2 h-8 w-8 shrink-0 border border-white/10">
              <AvatarImage src="" alt={user?.name} />
              <AvatarFallback className="bg-solana/20">
                {user?.name ? getInitials(user.name) : "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.name || "Admin User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email || "admin@example.com"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="ml-2 h-8 w-8 shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 w-full p-3 sm:p-4 backdrop-blur-lg bg-black/20 border-b border-white/5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center min-w-0 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="h-8 w-8 mr-2 shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <img src={BRAND_LOGO} width={28} height={28} alt="HeySolana" className="shrink-0" />
                <span className="font-bold text-gradient-solana truncate">HeySolana</span>
              </div>
            </div>

            <div className="hidden md:flex"></div>

            <div className="flex items-center space-x-2">
              <AdminNotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 flex items-center gap-2 px-2"
                  >
                    <Avatar className="h-7 w-7 border border-white/10">
                      <AvatarImage src="" alt={user?.name} />
                      <AvatarFallback className="bg-solana/20 text-xs">
                        {user?.name ? getInitials(user.name) : "AD"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden md:inline-block">
                      {user?.name || "admin"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-black/90 border-white/10"
                  align="end"
                >
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-3 sm:p-4 md:p-6 animate-fade-in page-transitions min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

import React, { useState } from "react";
import {
  BarChart3,
  ChevronFirst,
  ChevronLast,
  Coins,
  ListOrdered,
  LogOut,
  Menu,
  User,
  Wallet,
  X,
  BadgePercent,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Logo from "../../public/logo.png";
import { useMerchantAuth } from "./MerchantAuthContext";

interface MerchantLayoutProps {
  children: React.ReactNode;
}

const MerchantLayout: React.FC<MerchantLayoutProps> = ({ children }) => {
  const { merchant, logout } = useMerchantAuth();
  const [expanded, setExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const navItems = [
    { name: "Dashboard", icon: <BarChart3 className="h-5 w-5" />, path: "/dashboard" },
    { name: "Orders", icon: <ListOrdered className="h-5 w-5" />, path: "/orders" },
    { name: "Rates", icon: <BadgePercent className="h-5 w-5" />, path: "/rates" },
    { name: "Assets", icon: <Coins className="h-5 w-5" />, path: "/assets" },
    { name: "Wallets", icon: <Wallet className="h-5 w-5" />, path: "/wallets" },
    { name: "Profile", icon: <User className="h-5 w-5" />, path: "/profile" },
  ];

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {navItems.map((item) => {
        const active =
          location.pathname === item.path ||
          location.pathname.startsWith(`${item.path}/`);
        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              onNavigate?.();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-teal-600/20 text-teal-100"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            {item.icon}
            {(expanded || mobileMenuOpen) && <span>{item.name}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside
        className={cn(
          "hidden border-r border-white/10 bg-slate-900/80 backdrop-blur md:flex md:flex-col",
          expanded ? "w-64" : "w-20"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <img src={Logo} alt="Heyorova" className="h-8 w-8 rounded" />
            {expanded && (
              <div>
                <p className="text-sm font-semibold">Heyorova</p>
                <p className="text-xs text-slate-400">Merchant</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronFirst className="h-4 w-4" /> : <ChevronLast className="h-4 w-4" />}
          </Button>
        </div>
        <NavList />
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-2">
                <img src={Logo} alt="Heyorova" className="h-8 w-8 rounded" />
                <div>
                  <p className="text-sm font-semibold">Heyorova</p>
                  <p className="text-xs text-slate-400">Merchant</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavList onNavigate={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/50 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <p className="text-sm text-slate-400">Merchant portal</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                <Avatar className="h-8 w-8">
                  {merchant?.avatar_url && <AvatarImage src={merchant.avatar_url} />}
                  <AvatarFallback>
                    {merchant?.name ? getInitials(merchant.name) : "M"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm sm:inline">{merchant?.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{merchant?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {merchant?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default MerchantLayout;

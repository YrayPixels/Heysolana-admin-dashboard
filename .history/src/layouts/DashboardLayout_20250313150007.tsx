
import React, { useState } from 'react';
import { 
  BarChart3, 
  Bell, 
  ChevronFirst, 
  ChevronLast, 
  ClipboardList, 
  LogOut, 
  Menu, 
  User, 
  Volume2, 
  X
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from '../../public/logo.png';

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
  
  const navItems = [
    {
      name: 'Dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/dashboard',
    },
    {
      name: 'Waitlist',
      icon: <ClipboardList className="h-5 w-5" />,
      path: '/waitlist',
    },
    {
      name: 'Profile',
      icon: <User className="h-5 w-5" />,
      path: '/profile',
    },
  ];
  
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-background bg-noise">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto transition-all duration-300 glass-morphism z-10",
          expanded ? "w-60" : "w-20"
        )}
      >
        <div className="flex items-center justify-between p-4">
          <div className={cn("flex items-center", !expanded && "justify-center w-full")}>
            {expanded ? (
              <div className="flex items-center gap-2">
                img
                <span className="font-bold text-xl text-gradient-solana">VocalX</span>
              </div>
            ) : (
              <Volume2 className="h-6 w-6 text-solana" />
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
        
        <nav className="flex-1 py-6">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 mb-1",
                    !expanded && "justify-center",
                    isActive(item.path) && "bg-white/5"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  <span className={cn("transition-opacity", !expanded && "hidden")}>{item.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="mt-auto p-4 border-t border-white/5">
          <div className={cn("flex items-center", !expanded && "justify-center")}>
            <Avatar className="h-8 w-8 mr-2 border border-white/10">
              <AvatarImage src={user?.avatar} alt={user?.fullName} />
              <AvatarFallback className="bg-solana/20">
                {user?.fullName ? getInitials(user.fullName) : "AD"}
              </AvatarFallback>
            </Avatar>
            <div className={cn("flex-1 transition-opacity", !expanded && "hidden")}>
              <p className="text-sm font-medium">{user?.fullName || "Admin User"}</p>
              <p className="text-xs text-muted-foreground">{user?.username || "admin"}</p>
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
          "md:hidden fixed top-0 bottom-0 left-0 w-64 glass-morphism z-50 transform transition-transform duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-solana" />
            <span className="font-bold text-xl text-gradient-solana">VocalX</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="py-6">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 mb-1",
                    isActive(item.path) && "bg-white/5"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    toggleMobileMenu();
                  }}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="mt-auto p-4 border-t border-white/5">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2 border border-white/10">
              <AvatarImage src={user?.avatar} alt={user?.fullName} />
              <AvatarFallback className="bg-solana/20">
                {user?.fullName ? getInitials(user.fullName) : "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.fullName || "Admin User"}</p>
              <p className="text-xs text-muted-foreground">{user?.username || "admin"}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 ml-auto"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 w-full p-4 backdrop-blur-lg bg-black/20 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="h-8 w-8 mr-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-solana" />
                <span className="font-bold text-gradient-solana">VocalX</span>
              </div>
            </div>
            
            <div className="hidden md:flex"></div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-solana rounded-full"></span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 flex items-center gap-2 px-2">
                    <Avatar className="h-7 w-7 border border-white/10">
                      <AvatarImage src={user?.avatar} alt={user?.fullName} />
                      <AvatarFallback className="bg-solana/20 text-xs">
                        {user?.fullName ? getInitials(user.fullName) : "AD"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden md:inline-block">{user?.username || "admin"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-black/90 border-white/10" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
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
        <div className="p-4 md:p-6 animate-fade-in page-transitions">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

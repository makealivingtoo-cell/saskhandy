import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Briefcase,
  ChevronDown,
  DollarSign,
  Hammer,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Search,
  Shield,
  User,
} from "lucide-react";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const HOMEOWNER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/post-job", label: "Post a Job", icon: Plus },
];

const HANDYMAN_NAV: NavItem[] = [
  { href: "/handyman/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/handyman/browse", label: "Browse Jobs", icon: Search },
  { href: "/handyman/bids", label: "My Bids", icon: Briefcase },
  { href: "/handyman/earnings", label: "Earnings", icon: DollarSign },
  { href: "/handyman/profile", label: "Profile", icon: User },
];

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

  const navItems = user?.userType === "handyman" ? HANDYMAN_NAV : HOMEOWNER_NAV;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border/60 shadow-sm">
        <div className="container flex items-center justify-between h-14">
          <Link href={user?.userType === "handyman" ? "/handyman/dashboard" : "/dashboard"}>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                <Hammer className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-base tracking-tight">SaskHandy</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}

            {user?.role === "admin" && (
              <Link href="/admin">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    location === "/admin"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </div>
              </Link>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                  {user?.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.userType}</p>
              </div>

              <DropdownMenuSeparator />

              <div className="md:hidden">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}

                {user?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
              </div>

              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-destructive focus:text-destructive"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main className="pt-14">
        {title && (
          <div className="border-b border-border/40 bg-white">
            <div className="container py-6">
              <h1 className="text-2xl font-serif text-foreground">{title}</h1>
            </div>
          </div>
        )}
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
}
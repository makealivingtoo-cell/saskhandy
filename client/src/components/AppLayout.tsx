import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
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
  LifeBuoy,
  Loader2,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Shield,
  User,
} from "lucide-react";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MessagesCounterBadge, NotificationBell } from "@/components/NotificationBell";

interface NavItem {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: React.ElementType;
}

const HOMEOWNER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard },
  { href: "/post-job", label: "Post a Job", mobileLabel: "Post", icon: Plus },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

const HANDYMAN_NAV: NavItem[] = [
  { href: "/handyman/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard },
  { href: "/handyman/browse", label: "Browse Jobs", mobileLabel: "Browse", icon: Search },
  { href: "/handyman/bids", label: "My Bids", mobileLabel: "Bids", icon: Briefcase },
  { href: "/handyman/messages", label: "Messages", icon: MessageSquare },
  { href: "/handyman/earnings", label: "Earnings", icon: DollarSign },
  { href: "/handyman/profile", label: "Profile", icon: User },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

const HOMEOWNER_BOTTOM_NAV = HOMEOWNER_NAV.filter((item) =>
  ["/dashboard", "/post-job", "/messages"].includes(item.href)
);

const HANDYMAN_BOTTOM_NAV = HANDYMAN_NAV.filter((item) =>
  [
    "/handyman/dashboard",
    "/handyman/browse",
    "/handyman/bids",
    "/handyman/messages",
    "/handyman/profile",
  ].includes(item.href)
);

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

function isActiveRoute(location: string, href: string) {
  if (location === href) return true;

  if (href === "/handyman/browse" && location.startsWith("/handyman/jobs/")) {
    return true;
  }

  if (href === "/dashboard" && location.startsWith("/jobs/")) {
    return true;
  }

  return false;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

  const navItems = user?.userType === "handyman" ? HANDYMAN_NAV : HOMEOWNER_NAV;
  const bottomNavItems =
    user?.userType === "handyman" ? HANDYMAN_BOTTOM_NAV : HOMEOWNER_BOTTOM_NAV;

  const { data: handymanProfile } = trpc.handymanProfiles.get.useQuery(undefined, {
    enabled: user?.userType === "handyman",
  });

  const profileImageUrl =
    user?.userType === "handyman" ? handymanProfile?.profileImageUrl : null;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-border/60 shadow-sm">
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
              const isActive = isActiveRoute(location, item.href);

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
                    {item.label === "Messages" && <MessagesCounterBadge />}
                  </div>
                </Link>
              );
            })}

            {user?.role === "admin" && (
              <>
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

                <Link href="/admin/support">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      location === "/admin/support"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <LifeBuoy className="w-3.5 h-3.5" />
                    Support
                  </div>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2 sm:px-3">
                  <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={`${user?.name ?? "User"} profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-primary">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
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
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/support">
                          <LifeBuoy className="w-4 h-4 mr-2" />
                          Support Inbox
                        </Link>
                      </DropdownMenuItem>
                    </>
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
        </div>
      </nav>

      <main className="pt-14 pb-24 md:pb-0">
        {title && (
          <div className="border-b border-border/40 bg-white">
            <div className="container py-4 md:py-6">
              <h1 className="text-xl md:text-2xl font-serif text-foreground">{title}</h1>
            </div>
          </div>
        )}
        <div className="container py-5 md:py-8">{children}</div>
      </main>

      <nav
        aria-label="Primary mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className={cn(
            "mx-auto grid h-16 max-w-lg items-stretch",
            bottomNavItems.length === 3 ? "grid-cols-3" : "grid-cols-5"
          )}
        >
          {bottomNavItems.map((item) => {
            const isActive = isActiveRoute(location, item.href);
            const isPrimaryAction = item.href === "/post-job";

            return (
              <Link key={`mobile-${item.href}`} href={item.href}>
                <div
                  className={cn(
                    "relative flex h-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-all active:scale-95",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                      isPrimaryAction
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label === "Messages" && (
                      <span className="absolute -right-2 -top-2">
                        <MessagesCounterBadge />
                      </span>
                    )}
                  </div>
                  <span className={cn(isActive && "font-semibold")}>
                    {item.mobileLabel ?? item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

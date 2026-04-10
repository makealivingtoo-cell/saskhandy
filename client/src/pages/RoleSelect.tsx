import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Hammer, Home, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function RoleSelect() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selecting, setSelecting] = useState<"homeowner" | "handyman" | null>(null);

  const setUserType = trpc.auth.setUserType.useMutation({
    onSuccess: (_, variables) => {
      if (variables.userType === "homeowner") {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    },
    onError: (err) => {
      toast.error(err.message);
      setSelecting(null);
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
    if (!loading && isAuthenticated && user) {
      if (user.userType === "homeowner") navigate("/dashboard");
      else if (user.userType === "handyman") navigate("/handyman/dashboard");
    }
  }, [loading, isAuthenticated, user]);

  const handleSelect = (type: "homeowner" | "handyman") => {
    setSelecting(type);
    setUserType.mutate({ userType: type });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Hammer className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-3">
            Welcome to SaskHandy
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us how you'll be using the platform.
          </p>
          {user?.name && (
            <p className="text-sm text-muted-foreground mt-2">
              Signed in as <span className="font-medium text-foreground">{user.name}</span>
            </p>
          )}
        </div>

        {/* Role Cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Homeowner */}
          <button
            onClick={() => handleSelect("homeowner")}
            disabled={!!selecting}
            className="group relative bg-white border-2 border-border hover:border-primary rounded-2xl p-8 text-left transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center mb-5 transition-colors">
              {selecting === "homeowner" ? (
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              ) : (
                <Home className="w-7 h-7 text-primary" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">I Need Work Done</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Post jobs, review bids from qualified handymen, and pay securely through escrow.
            </p>
            <ul className="mt-4 space-y-1.5">
              {["Post unlimited jobs", "Compare bids", "Secure escrow payments", "Leave reviews"].map((item) => (
                <li key={item} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-border group-hover:border-primary transition-colors" />
          </button>

          {/* Handyman */}
          <button
            onClick={() => handleSelect("handyman")}
            disabled={!!selecting}
            className="group relative bg-white border-2 border-border hover:border-primary rounded-2xl p-8 text-left transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center mb-5 transition-colors">
              {selecting === "handyman" ? (
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              ) : (
                <Hammer className="w-7 h-7 text-primary" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">I'm a Handyman</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Browse available jobs in your area, place competitive bids, and grow your business.
            </p>
            <ul className="mt-4 space-y-1.5">
              {["Browse open jobs", "Place bids", "Keep 80% of earnings", "Build your reputation"].map((item) => (
                <li key={item} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-border group-hover:border-primary transition-colors" />
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          This selection can be changed later in your account settings.
        </p>
      </div>
    </div>
  );
}

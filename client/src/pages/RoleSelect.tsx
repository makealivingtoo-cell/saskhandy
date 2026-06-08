import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle, Hammer, Home, Loader2, Search, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
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
    if (loading) return;

    if (isAuthenticated && user) {
      if (user.userType === "homeowner") {
        navigate("/dashboard");
        return;
      }

      if (user.userType === "handyman") {
        navigate("/handyman/dashboard");
        return;
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  const handleSelect = (type: "homeowner" | "handyman") => {
    if (!isAuthenticated) {
      toast.info("Create an account or sign in first, then choose how you want to use SaskHandy.");
      navigate("/sign-up");
      return;
    }

    setSelecting(type);
    setUserType.mutate({ userType: type });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="mb-6">
            <Link href="/">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-border/60 shadow-sm p-8 md:p-10">
            <div className="text-center mb-10">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Hammer className="w-6 h-6 text-primary-foreground" />
              </div>

              <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-3">
                Choose how you want to use SaskHandy
              </h1>

              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Create an account to post home jobs, compare local bids, or sign up as a handyman
                to browse open jobs and start bidding.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl border border-border bg-background p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-primary" />
                </div>

                <h2 className="text-xl font-semibold text-foreground mb-2">For Homeowners</h2>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Post small home jobs, compare local bids, message before choosing, and keep the
                  job organized in one place.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Hammer className="w-6 h-6 text-primary" />
                </div>

                <h2 className="text-xl font-semibold text-foreground mb-2">For Handymen</h2>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Create your profile, view open local jobs, send bids, and get found by homeowners
                  looking for help.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/sign-up">Create Account</Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <Link href="/">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </div>
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Hammer className="w-6 h-6 text-primary-foreground" />
          </div>

          <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-3">
            Welcome to SaskHandy
          </h1>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Choose how you want to use SaskHandy. This helps us send you to the right dashboard.
          </p>

          {user?.name && (
            <p className="text-sm text-muted-foreground mt-2">
              Signed in as <span className="font-medium text-foreground">{user.name}</span>
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <button
            type="button"
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
              Post a small home job, compare local bids, message before choosing, and move forward
              when you’re ready.
            </p>

            <ul className="mt-5 space-y-2">
              {[
                "Post jobs around your home",
                "Compare local bids",
                "Message before choosing",
                "Review the handyman profile first",
              ].map((item) => (
                <li key={item} className="text-xs text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-border group-hover:border-primary transition-colors" />
          </button>

          <button
            type="button"
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

            <h2 className="text-xl font-semibold text-foreground mb-2">I Want Local Jobs</h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Create your handyman profile, browse open jobs in your area, send bids, and build
              your reputation on SaskHandy.
            </p>

            <ul className="mt-5 space-y-2">
              {[
                "View open jobs",
                "Bid on jobs that fit your skills",
                "Message homeowners through SaskHandy",
                "Build trust with your profile",
              ].map((item) => (
                <li key={item} className="text-xs text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-xl bg-primary/5 border border-primary/20 p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You can view jobs first. To send bids, complete your profile and ID Name Matched
                  so homeowners know who they’re reviewing.
                </p>
              </div>
            </div>

            <div className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-border group-hover:border-primary transition-colors" />
          </button>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/open-jobs-saskatoon">
              <Search className="w-4 h-4 mr-2" />
              View Open Jobs First
            </Link>
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Handymen can view jobs before completing verification.
          </p>
        </div>
      </div>
    </div>
  );
}
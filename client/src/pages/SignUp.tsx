import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

type UserType = "homeowner" | "handyman";

const TERMS_VERSION = "2026-04-11";
const PRIVACY_VERSION = "2026-04-11";

export default function SignUp() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType>("homeowner");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  const signUp = trpc.auth.signUp.useMutation({
    onSuccess: ({ user }) => {
      toast.success("Account created successfully.");

      if (user.userType === "handyman") {
        navigate("/onboarding");
        return;
      }

      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const isFormValid =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword &&
    agreeTerms &&
    agreePrivacy &&
    confirmAge;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!agreeTerms || !agreePrivacy || !confirmAge) {
      toast.error("Please accept the required agreements before signing up.");
      return;
    }

    signUp.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      userType,
      agreeTerms: true,
      agreePrivacy: true,
      confirmAge: true,
      marketingOptIn,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    });
  };

  return (
    <AppLayout title="Create Account">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-serif text-foreground mb-2">Join SaskHandy</h1>
            <p className="text-sm text-muted-foreground">
              Create your account to post jobs or bid as a handyman.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <Input
                id="name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">I am signing up as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("homeowner")}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    userType === "homeowner"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/30"
                  }`}
                >
                  Homeowner
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("handyman")}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    userType === "handyman"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/30"
                  }`}
                >
                  Handyman
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span className="text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms">
                    <span className="text-primary hover:underline cursor-pointer">
                      Terms and Conditions
                    </span>
                  </Link>
                  .
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span className="text-muted-foreground">
                  I have read and agree to the{" "}
                  <Link href="/privacy">
                    <span className="text-primary hover:underline cursor-pointer">
                      Privacy Policy
                    </span>
                  </Link>
                  .
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={confirmAge}
                  onChange={(e) => setConfirmAge(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span className="text-muted-foreground">
                  I confirm that I am at least 18 years old and legally able to enter into this agreement.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span className="text-muted-foreground">
                  I would like to receive occasional product updates and service emails.
                </span>
              </label>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-800 leading-relaxed">
                SaskHandy is a platform that connects homeowners and independent handymen. Handymen
                are responsible for ensuring they are properly licensed, insured, and qualified for
                any work they accept.
              </p>
              <p className="text-[11px] text-amber-700 mt-2">
                Terms version: {TERMS_VERSION} • Privacy version: {PRIVACY_VERSION}
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={signUp.isPending || !isFormValid}>
              {signUp.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account?{" "}
            <Link href="/sign-in">
              <span className="text-primary hover:underline cursor-pointer">Sign in</span>
            </Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
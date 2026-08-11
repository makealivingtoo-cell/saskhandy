import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { trackCompleteRegistration } from "@/lib/metaPixel";
import { Eye, EyeOff, Hammer, Loader2, UserCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

type UserType = "homeowner" | "handyman";

const TERMS_VERSION = "2026-04-11";
const PRIVACY_VERSION = "2026-04-11";

const HANDYMAN_SKILLS = [
  "General Helper",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "HVAC",
  "Landscaping",
  "Cleaning",
  "Drywall",
  "Roofing",
];


export default function SignUp() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userType, setUserType] = useState<UserType>("homeowner");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((item) => item !== skill)
        : [...prev, skill]
    );
  };

  const signUp = trpc.auth.signUp.useMutation({
    onSuccess: (data: any) => {
      trackCompleteRegistration("website");

      if (data?.emailSent === false) {
        toast.warning(
          "Account created, but verification email could not be sent yet. You can resend it on the next screen."
        );
      } else {
        toast.success(
          userType === "handyman"
            ? "Account created. Verify your email, then complete your profile and ID Name Matched approval before bidding."
            : "Account created. Check your email to verify your account."
        );
      }

      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const resendVerification = trpc.auth.resendVerification.useMutation({
    onSuccess: (data: any) => {
      if (data?.emailSent) {
        toast.success("Verification email sent.");
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
      } else {
        toast.error("We could not send the verification email right now.");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const hasRequiredSkills =
    userType === "homeowner" || selectedSkills.length >= 1;

  const isFormValid =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    phoneNumber.trim().replace(/\D/g, "").length >= 10 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword &&
    hasRequiredSkills &&
    agreeTerms &&
    agreePrivacy &&
    confirmAge;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (phoneNumber.trim().replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid phone number for important SaskHandy job updates.");
      return;
    }

    if (userType === "handyman" && selectedSkills.length < 1) {
      toast.error("Please select at least one skill so we can match you with jobs.");
      return;
    }

    if (!agreeTerms || !agreePrivacy || !confirmAge) {
      toast.error("Please accept the required agreements before signing up.");
      return;
    }

    signUp.mutate({
      name: name.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      userType,
      skills: userType === "handyman" ? selectedSkills : [],
      agreeTerms: true,
      agreePrivacy: true,
      confirmAge: true,
      marketingOptIn,
      smsConsent,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-white">
        <div className="container flex items-center justify-between h-14">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Hammer className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-base tracking-tight">SaskHandy</span>
            </div>
          </Link>

          <Link href="/">
            <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              Back to Home
            </span>
          </Link>
        </div>
      </header>

      <main className="container py-10">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-serif text-foreground mb-2">Join SaskHandy</h1>
              <p className="text-sm text-muted-foreground">
                Create an account to post jobs or bid on local home projects.
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

                <p className="text-xs text-muted-foreground">
                  {userType === "handyman"
                    ? "Use your legal name. If you submit ID verification later, this name must match your government ID."
                    : "Use your real name so people know who they are communicating with."}
                </p>
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
                <label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="306-555-1234"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used for important SaskHandy job updates, payment updates, and support. Your
                  number is not shown publicly.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">I am signing up as</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUserType("homeowner");
                      setSelectedSkills([]);
                    }}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      userType === "homeowner"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className="block text-sm font-semibold">Homeowner</span>
                    <span className="block text-xs mt-1 text-muted-foreground">
                      Post jobs and compare local bids.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType("handyman")}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      userType === "handyman"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className="block text-sm font-semibold">Handyman</span>
                    <span className="block text-xs mt-1 text-muted-foreground">
                      Build a verified profile and bid on local jobs.
                    </span>
                  </button>
                </div>
              </div>

              {userType === "handyman" && (
                <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Before you can bid
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        To help homeowners feel safer, handymen must complete a profile and get ID
                        Name Matched before sending bids. After signup, you’ll add a profile photo,
                        short bio, skills/services, and submit ID for review.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label htmlFor="skillSelect" className="text-sm font-medium text-foreground">
                        Add your skills
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose at least one skill so we can show you relevant local jobs.
                      </p>
                    </div>

                    <select
                      id="skillSelect"
                      value=""
                      onChange={(e) => {
                        const skill = e.target.value;
                        if (!skill) return;

                        setSelectedSkills((prev) =>
                          prev.includes(skill) ? prev : [...prev, skill]
                        );

                        e.currentTarget.value = "";
                      }}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="">Select a skill to add...</option>
                      {HANDYMAN_SKILLS.filter((skill) => !selectedSkills.includes(skill)).map(
                        (skill) => (
                          <option key={skill} value={skill}>
                            {skill}
                          </option>
                        )
                      )}
                    </select>

                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              className="rounded-full hover:bg-primary/10"
                              aria-label={`Remove ${skill}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {selectedSkills.length < 1 && (
                      <p className="text-xs text-destructive">
                        Please select at least one skill to continue.
                      </p>
                    )}
                  </div>
                </div>
              )}

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

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2.5">
                <label className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
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

                <label className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
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

                <label className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={confirmAge}
                    onChange={(e) => setConfirmAge(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
                  />
                  <span className="text-muted-foreground">
                    I confirm that I am at least 18 years old and legally able to enter into this
                    agreement.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
                  />
                  <span className="text-muted-foreground">
                    I agree to receive important SaskHandy text messages about my account, jobs, bids,
                    payments, disputes, and support. Message and data rates may apply.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
                  />
                  <span className="text-muted-foreground">
                    I would like to receive occasional product updates and service emails.
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={signUp.isPending || !isFormValid}
              >
                {signUp.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : userType === "handyman" ? (
                  "Create Handyman Account"
                ) : (
                  "Create Homeowner Account"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already signed up but did not get the email?
              </p>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => resendVerification.mutate({ email: email.trim() })}
                disabled={!email.trim() || resendVerification.isPending}
              >
                {resendVerification.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Already have an account?{" "}
              <Link href="/sign-in">
                <span className="text-primary hover:underline cursor-pointer">Sign in</span>
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
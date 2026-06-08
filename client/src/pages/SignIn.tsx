import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function SignIn() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");

  const redirectUser = (user: any) => {
    if (user.role === "admin") {
      navigate("/admin");
      return;
    }

    if (user.userType === "homeowner") {
      navigate("/dashboard");
      return;
    }

    if (user.userType === "handyman") {
      navigate("/handyman/browse");
      return;
    }

    navigate("/role-select");
  };

  const signIn = trpc.auth.signIn.useMutation({
    onSuccess: async (data: any) => {
      if (data.twoFactorRequired) {
        setTwoFactorStep(true);
        setTwoFactorEmail(data.email ?? email.trim());
        setChallengeId(data.challengeId);
        setCode("");
        toast.success("Admin verification code sent to your email.");
        return;
      }

      await utils.auth.me.invalidate();
      redirectUser(data.user);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyTwoFactorCode = trpc.auth.verifyTwoFactorCode.useMutation({
    onSuccess: async (data: any) => {
      await utils.auth.me.invalidate();
      toast.success("Admin sign-in verified.");
      redirectUser(data.user);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (twoFactorStep) {
      verifyTwoFactorCode.mutate({
        email: twoFactorEmail,
        challengeId,
        code: code.trim(),
      });
      return;
    }

    signIn.mutate({
      email,
      password,
    });
  };

  const goBackToPassword = () => {
    setTwoFactorStep(false);
    setChallengeId("");
    setCode("");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          {twoFactorStep ? (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
          ) : null}

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {twoFactorStep ? "Admin verification" : "Sign in"}
          </h1>

          <p className="mt-2 text-slate-600">
            {twoFactorStep
              ? `Enter the 6-digit code sent to ${twoFactorEmail}.`
              : "Access your SaskHandy account"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {!twoFactorStep ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Forgot password?
                  </Link>
                </div>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
                  placeholder="Enter your password"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                6-digit code
              </label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                minLength={6}
                maxLength={6}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-center text-2xl font-semibold tracking-[0.35em] outline-none focus:border-emerald-600"
                placeholder="000000"
              />

              <p className="mt-3 text-sm text-slate-500">
                This code expires in 10 minutes. If it expires, go back and sign in again to send a
                new code.
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800"
            disabled={signIn.isPending || verifyTwoFactorCode.isPending}
          >
            {signIn.isPending || verifyTwoFactorCode.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {twoFactorStep ? "Verifying" : "Signing in"}
              </>
            ) : twoFactorStep ? (
              "Verify and Sign In"
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {twoFactorStep ? (
          <button
            type="button"
            onClick={goBackToPassword}
            className="mt-4 w-full text-center text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Back to password sign in
          </button>
        ) : (
          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="font-medium text-emerald-700 hover:text-emerald-800">
              Sign up
            </Link>
          </p>
        )}

        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-800">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
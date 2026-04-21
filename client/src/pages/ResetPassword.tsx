import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

function getTokenFromUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ?? "";
}

export default function ResetPassword() {
  const [, navigate] = useLocation();

  const token = useMemo(() => getTokenFromUrl(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setIsComplete(true);
      toast.success("Your password has been reset.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const passwordError =
    confirmPassword && password !== confirmPassword ? "Passwords do not match" : "";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    resetPassword.mutate({
      token,
      password,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Invalid reset link</h1>
          <p className="mt-2 text-slate-600">
            This password reset link is missing a token or is not valid.
          </p>

          <p className="mt-6 text-center text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              Request a new reset link
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reset password</h1>
          <p className="mt-2 text-slate-600">Choose a new password for your SaskHandy account</p>
        </div>

        {isComplete ? (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              Your password has been updated successfully.
            </div>

            <Button
              type="button"
              className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800"
              onClick={() => navigate("/sign-in")}
            >
              Go to sign in
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
                  placeholder="Enter a new password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
                  placeholder="Re-enter your new password"
                />
                {passwordError ? (
                  <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800"
                disabled={resetPassword.isPending || !!passwordError}
              >
                {resetPassword.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm">
              <Link
                href="/sign-in"
                className="font-medium text-emerald-700 hover:text-emerald-800"
              >
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
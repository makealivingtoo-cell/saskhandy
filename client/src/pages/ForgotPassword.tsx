import { useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("If that email exists, a reset link has been sent.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestReset.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Forgot password
          </h1>
          <p className="mt-2 text-slate-600">
            Enter your email and we’ll send you a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              If an account exists for <span className="font-medium">{email}</span>, a reset link
              has been sent.
            </div>

            <p className="text-sm text-slate-600">
              Check your inbox and spam folder, then open the link to choose a new password.
            </p>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
              >
                Try another email
              </Button>

              <p className="text-center text-sm">
                <Link
                  href="/sign-in"
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="space-y-5">
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

              <Button
                type="submit"
                className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800"
                disabled={requestReset.isPending}
              >
                {requestReset.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link
                  </>
                ) : (
                  "Send reset link"
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
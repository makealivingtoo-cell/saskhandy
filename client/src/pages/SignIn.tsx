import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function SignIn() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = trpc.auth.signIn.useMutation({
    onSuccess: async (data) => {
      await utils.auth.me.invalidate();

      const userType = data.user.userType;

      if (userType === "homeowner") {
        navigate("/dashboard");
        return;
      }

      if (userType === "handyman") {
        navigate("/handyman/dashboard");
        return;
      }

      navigate("/role-select");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn.mutate({
      email,
      password,
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-2 text-slate-600">Access your SaskHandy account</p>
        </div>

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

          <Button
            type="submit"
            className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800"
            disabled={signIn.isPending}
          >
            {signIn.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-emerald-700 hover:text-emerald-800">
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-800">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
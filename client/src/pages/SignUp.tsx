import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type UserType = "homeowner" | "handyman";

export default function SignUp() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("homeowner");

  const signUp = trpc.auth.signUp.useMutation({
    onSuccess: async (data) => {
      await utils.auth.me.invalidate();

      if (data.user.userType === "homeowner") {
        navigate("/dashboard");
        return;
      }

      navigate("/onboarding");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signUp.mutate({
      name,
      email,
      password,
      userType,
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-2 text-slate-600">Join SaskHandy as a homeowner or handyman</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              placeholder="Your name"
            />
          </div>

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
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">I am joining as</label>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setUserType("homeowner")}
                className={`rounded-2xl border p-5 text-left transition ${
                  userType === "homeowner"
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-300 bg-white"
                }`}
              >
                <div className="text-lg font-semibold text-slate-900">Homeowner</div>
                <div className="mt-1 text-sm text-slate-600">
                  Post jobs and hire local help
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUserType("handyman")}
                className={`rounded-2xl border p-5 text-left transition ${
                  userType === "handyman"
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-300 bg-white"
                }`}
              >
                <div className="text-lg font-semibold text-slate-900">Handyman</div>
                <div className="mt-1 text-sm text-slate-600">
                  Find jobs and grow your business
                </div>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800"
            disabled={signUp.isPending}
          >
            {signUp.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-emerald-700 hover:text-emerald-800">
            Sign in
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
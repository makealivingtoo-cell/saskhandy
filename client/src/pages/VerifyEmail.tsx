import { Button } from "@/components/ui/button";
import { Hammer, Loader2, MailCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const search = useSearch();
  const [, navigate] = useLocation();

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">(
    token ? "verifying" : "idle"
  );

  const verifyEmail = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("verified");
      toast.success("Email verified. You can now sign in.");
    },
    onError: (err) => {
      setStatus("error");
      toast.error(err.message);
    },
  });

  const resendVerification = trpc.auth.resendVerification.useMutation({
    onSuccess: (data: any) => {
      if (data?.emailSent) {
        toast.success("Verification email sent.");
      } else {
        toast.error("We could not send the verification email right now.");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (token) {
      verifyEmail.mutate({ token });
    }
  }, [token]);

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
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              {status === "verifying" ? (
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              ) : (
                <MailCheck className="w-7 h-7 text-primary" />
              )}
            </div>

            {status === "verifying" && (
              <>
                <h1 className="text-2xl font-semibold text-foreground mb-2">Verifying email</h1>
                <p className="text-sm text-muted-foreground">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {status === "verified" && (
              <>
                <h1 className="text-2xl font-semibold text-foreground mb-2">Email verified</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Your email has been verified successfully. You can now sign in.
                </p>
                <Button onClick={() => navigate("/sign-in")} className="w-full">
                  Go to Sign In
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <h1 className="text-2xl font-semibold text-foreground mb-2">Verification failed</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  This verification link is invalid or expired. You can request a new one below.
                </p>

                {email ? (
                  <Button
                    variant="outline"
                    className="w-full mb-3"
                    onClick={() => resendVerification.mutate({ email })}
                    disabled={resendVerification.isPending}
                  >
                    {resendVerification.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Resend Verification Email
                  </Button>
                ) : null}

                <Button onClick={() => navigate("/sign-in")} className="w-full">
                  Go to Sign In
                </Button>
              </>
            )}

            {status === "idle" && (
              <>
                <h1 className="text-2xl font-semibold text-foreground mb-2">Verify your email</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  We sent a verification email to {email || "your email address"}. Please click the
                  link in that email before signing in.
                </p>

                {email ? (
                  <Button
                    variant="outline"
                    className="w-full mb-3"
                    onClick={() => resendVerification.mutate({ email })}
                    disabled={resendVerification.isPending}
                  >
                    {resendVerification.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Resend Verification Email
                  </Button>
                ) : null}

                <Button onClick={() => navigate("/sign-in")} className="w-full">
                  Go to Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CheckCircle2, CreditCard, Loader2, Shield, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
const showTestCard =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_STRIPE_TEST_CARD === "true";

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ amount, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Payment form is still loading. Please try again.");
      return;
    }

    setInlineError(null);
    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      const message = error.message ?? "Payment failed. Please try again.";
      setInlineError(message);
      toast.error(message);
      setProcessing(false);
      return;
    }

    if (
      paymentIntent?.status === "succeeded" ||
      paymentIntent?.status === "processing"
    ) {
      onSuccess();
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {inlineError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          {inlineError}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>
          You pay <strong>${amount.toFixed(2)} CAD</strong> now. SaskHandy holds
          the payment until you confirm the job is complete.
        </span>
      </div>

      <div className="sticky bottom-0 -mx-1 bg-white pt-3">
        <div className="flex gap-2">
          <Button
            type="submit"
            className="h-11 flex-1"
            disabled={!stripe || processing}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Securing payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ${amount.toFixed(2)} CAD
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={processing}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

interface StripePaymentModalProps {
  jobId: number;
  amount: number;
  jobTitle?: string;
  handymanName?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function StripePaymentModal({
  jobId,
  amount,
  jobTitle,
  handymanName,
  onSuccess,
  onClose,
}: StripePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const utils = trpc.useUtils();

  const createIntent = trpc.stripe.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      if (data.alreadyPaid) {
        setLoading(false);
        setPaymentSubmitted(true);
        return;
      }

      if (!data.clientSecret) {
        toast.error("Failed to initialize payment.");
        setLoading(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setLoading(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setLoading(false);
    },
  });

  useEffect(() => {
    if (!publishableKey) {
      toast.error("Stripe publishable key is missing.");
      setLoading(false);
      return;
    }

    createIntent.mutate({ jobId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handlePaymentSubmitted = async () => {
    setPaymentSubmitted(true);
    await Promise.all([
      utils.payments.getByJob.invalidate({ jobId }),
      utils.jobs.getById.invalidate({ jobId }),
      utils.bids.getForJob.invalidate({ jobId }),
    ]);
  };

  const elementOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe" as const,
        variables: {
          colorPrimary: "#2d6a4f",
          borderRadius: "8px",
        },
      },
    }),
    [clientSecret],
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 px-4 pt-4 backdrop-blur-sm sm:items-center sm:py-4"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex max-h-[calc(100dvh-2rem-env(safe-area-inset-bottom))] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 border-b border-border/60 p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">
              {paymentSubmitted ? "Payment submitted" : "Secure your handyman"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {paymentSubmitted
                ? "Your job will activate as soon as Stripe confirms the payment."
                : handymanName
                  ? `Hiring ${handymanName}`
                  : "Secure payment via Stripe"}
            </p>
          </div>

          {!paymentSubmitted && (
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close payment"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div
          className="flex-1 overflow-y-auto p-5"
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          {paymentSubmitted ? (
            <div className="py-3 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-foreground">
                You’re done here
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Payment has been submitted. SaskHandy will move the job into
                active work once the payment confirmation is received. You can
                keep messaging your handyman in the meantime.
              </p>

              <Button className="mt-5 w-full" onClick={onSuccess}>
                Continue to job
              </Button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !stripePromise ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Stripe is not configured correctly. Add your publishable key
                first.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          ) : clientSecret ? (
            <>
              {(jobTitle || handymanName) && (
                <div className="mb-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                  {jobTitle && (
                    <p className="text-sm font-medium text-foreground">
                      {jobTitle}
                    </p>
                  )}
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      {handymanName
                        ? `Handyman: ${handymanName}`
                        : "Accepted bid"}
                    </span>
                    <strong className="text-foreground">
                      ${amount.toFixed(2)} CAD
                    </strong>
                  </div>
                </div>
              )}

              <Elements stripe={stripePromise} options={elementOptions}>
                <PaymentForm
                  amount={amount}
                  onSuccess={handlePaymentSubmitted}
                  onCancel={onClose}
                />
              </Elements>
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Failed to initialize payment. Please close this window and try
                again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          )}

          {showTestCard && !paymentSubmitted && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Test mode: 4242 4242 4242 4242 · Any future date · Any CVC
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Loader2, Shield, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ amount, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe is still loading. Please try again.");
      return;
    }

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message ?? "Payment failed. Please try again.");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      toast.success("Payment submitted successfully.");
      onSuccess();
      return;
    }

    toast.info("Payment status updated. Please refresh if needed.");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span>
          $<strong>{amount.toFixed(2)} CAD</strong> will be held in secure escrow and released
          only after the homeowner confirms the work is complete.
        </span>
      </div>

      <div className="sticky bottom-0 -mx-1 bg-white pt-3">
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={!stripe || processing}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ${amount.toFixed(2)} CAD
              </>
            )}
          </Button>

          <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
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
  onSuccess: () => void;
  onClose: () => void;
}

export function StripePaymentModal({
  jobId,
  amount,
  onSuccess,
  onClose,
}: StripePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const utils = trpc.useUtils();

  const createIntent = trpc.stripe.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      if (data.alreadyPaid) {
        toast.info("Payment already completed for this job.");
        setLoading(false);
        onSuccess();
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

  const handleSuccess = async () => {
    await utils.payments.getByJob.invalidate({ jobId });
    await utils.jobs.getById.invalidate({ jobId });
    await utils.bids.getForJob.invalidate({ jobId });
    onSuccess();
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
    [clientSecret]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border/60 p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Complete Payment</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Secure escrow payment via Stripe
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !stripePromise ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Stripe is not configured correctly. Add your publishable key first.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={elementOptions}>
              <PaymentForm amount={amount} onSuccess={handleSuccess} onCancel={onClose} />
            </Elements>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Failed to initialize payment. Please try again.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={onClose}>
                Close
              </Button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Test card: 4242 4242 4242 4242 · Any future date · Any CVC
          </p>
        </div>
      </div>
    </div>
  );
}
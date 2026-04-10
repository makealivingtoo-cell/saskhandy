import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Loader2, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

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
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message ?? "Payment failed. Please try again.");
      setProcessing(false);
    } else {
      toast.success("Payment successful! Funds held in escrow.");
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>
          $<strong>{amount.toFixed(2)} CAD</strong> will be held in secure escrow and released only after you confirm the work is complete.
        </span>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={!stripe || processing}>
          {processing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <><CreditCard className="w-4 h-4 mr-2" />Pay ${amount.toFixed(2)} CAD</>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
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

export function StripePaymentModal({ jobId, amount, onSuccess, onClose }: StripePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const utils = trpc.useUtils();

  const createIntent = trpc.stripe.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      if (data.alreadyPaid) {
        toast.info("Payment already processed for this job.");
        onSuccess();
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
    createIntent.mutate({ jobId });
  }, [jobId]);

  const handleSuccess = () => {
    utils.payments.getByJob.invalidate({ jobId });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-foreground text-lg">Complete Payment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Secure escrow payment via Stripe</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#2d6a4f",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <PaymentForm amount={amount} onSuccess={handleSuccess} onCancel={onClose} />
          </Elements>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Failed to initialize payment. Please try again.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onClose}>Close</Button>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground mt-4">
          Test card: 4242 4242 4242 4242 · Any future date · Any CVC
        </p>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type LineItem = { description: string; quantity: number; unitPrice: number };

function parseLineItems(value?: string | null): LineItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function QuotePaymentForm({
  amount,
  onPaymentSubmitted,
}: {
  amount: number;
  onPaymentSubmitted: () => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setInlineError(null);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      const message = error.message ?? "Payment could not be completed. Please try again.";
      setInlineError(message);
      toast.error(message);
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      await onPaymentSubmitted();
      setProcessing(false);
      return;
    }

    setInlineError("Your payment is still processing. Please wait a moment and check the status.");
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {inlineError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {inlineError}
        </p>
      )}
      <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>Secure payment by Stripe. Total: <strong>${amount.toFixed(2)} CAD</strong>.</span>
      </div>
      <Button className="w-full" type="submit" disabled={!stripe || processing}>
        {processing ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing payment...</>
        ) : (
          <><CreditCard className="mr-2 h-4 w-4" />Pay ${amount.toFixed(2)} CAD</>
        )}
      </Button>
    </form>
  );
}

export default function PublicQuotePage() {
  const [, params] = useRoute<{ token: string }>("/quote/:token");
  const token = params?.token ?? "";
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const {
    data: quote,
    isLoading,
    error,
    refetch,
  } = trpc.quotes.getPublic.useQuery(
    { token },
    { enabled: Boolean(token), retry: false }
  );

  const respond = trpc.quotes.respond.useMutation();
  const createPaymentIntent = trpc.stripe.createQuotePaymentIntent.useMutation();
  const confirmPayment = trpc.stripe.confirmQuotePayment.useMutation();

  const lineItems = useMemo(() => parseLineItems(quote?.lineItems), [quote?.lineItems]);
  const paymentOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "stripe" as const,
              variables: { colorPrimary: "#2d6a4f", borderRadius: "8px" },
            },
          }
        : undefined,
    [clientSecret]
  );

  const handleDecision = async (decision: "approved" | "declined") => {
    try {
      await respond.mutateAsync({ token, decision });
      toast.success(decision === "approved" ? "Quote approved." : "Quote declined.");
      await refetch();
    } catch (mutationError: any) {
      toast.error(mutationError.message ?? "Could not update this quote.");
    }
  };

  const handleStartPayment = async () => {
    if (!stripePromise) {
      toast.error("Online payment is not available right now.");
      return;
    }
    try {
      const result = await createPaymentIntent.mutateAsync({ token });
      if (result.alreadyPaid) {
        await refetch();
        return;
      }
      if (!result.clientSecret) {
        toast.error("Could not start the payment form. Please try again.");
        return;
      }
      setClientSecret(result.clientSecret);
    } catch (mutationError: any) {
      toast.error(mutationError.message ?? "Could not start payment.");
    }
  };

  const handlePaymentSubmitted = async () => {
    try {
      const result = await confirmPayment.mutateAsync({ token });
      setClientSecret(null);
      if (result.status === "paid") {
        toast.success("Payment received. Thank you.");
      } else {
        toast.info("Stripe is confirming your payment. This page will update shortly.");
      }
      await Promise.all([refetch(), utils.quotes.getPublic.invalidate({ token })]);
    } catch (mutationError: any) {
      toast.error(mutationError.message ?? "Payment was submitted, but its status could not be checked yet.");
      await refetch();
    }
  };

  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        {isLoading ? (
          <div className="flex justify-center rounded-2xl border bg-white py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : error || !quote ? (
          <div className="rounded-2xl border bg-white p-8 text-center">
            <XCircle className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Quote unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This link may be invalid or the quote may have expired. Contact your handyman for help.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl border border-border/60 bg-white p-6 sm:p-8">
              <p className="text-sm font-medium text-primary">Quote from SaskHandy</p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground">{quote.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">Quote from {quote.handymanName}</p>

              <div className="mt-6 border-t border-border/60 pt-5">
                <h2 className="text-sm font-semibold text-foreground">Work details</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{quote.scope}</p>
              </div>

              {lineItems.length > 0 && (
                <div className="mt-5 space-y-2 border-t border-border/60 pt-5">
                  {lineItems.map((item, index) => (
                    <div key={`${item.description}-${index}`} className="flex justify-between gap-4 text-sm">
                      <span>{item.description} <span className="text-muted-foreground">× {item.quantity}</span></span>
                      <span>${(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {quote.customerNote && (
                <div className="mt-5 rounded-xl bg-muted/40 p-4">
                  <h2 className="text-sm font-semibold">Note</h2>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{quote.customerNote}</p>
                </div>
              )}
              {quote.terms && (
                <div className="mt-4">
                  <h2 className="text-sm font-semibold">Terms</h2>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{quote.terms}</p>
                </div>
              )}

              <div className="mt-6 space-y-2 border-t border-border/60 pt-5 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${Number(quote.subtotal).toFixed(2)} CAD</span></div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({Number(quote.taxRate ?? 0).toFixed(2)}%)</span>
                  <span>${Number(quote.taxAmount).toFixed(2)} CAD</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-3 text-base font-semibold">
                  <span>Total</span><span>${Number(quote.totalAmount).toFixed(2)} CAD</span>
                </div>
                {quote.expiresAt && (
                  <p className="pt-2 text-xs text-muted-foreground">
                    Valid until {new Date(quote.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-white p-6 sm:p-8">
              {quote.status === "paid" ? (
                <div className="text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                  <h2 className="mt-3 text-lg font-semibold">Payment received</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Your handyman has been notified.</p>
                </div>
              ) : quote.status === "declined" ? (
                <p className="text-center text-sm text-muted-foreground">You declined this quote.</p>
              ) : quote.status === "expired" ? (
                <p className="text-center text-sm text-muted-foreground">This quote has expired. Contact your handyman for an updated quote.</p>
              ) : quote.status === "sent" || quote.status === "viewed" ? (
                <div>
                  <h2 className="text-lg font-semibold">Would you like to accept this quote?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">You can review the details above before choosing.</p>
                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      className="sm:flex-1"
                      disabled={respond.isPending}
                      onClick={() => void handleDecision("declined")}
                    >
                      Decline quote
                    </Button>
                    <Button
                      className="sm:flex-1"
                      disabled={respond.isPending}
                      onClick={() => void handleDecision("approved")}
                    >
                      {respond.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Approve quote
                    </Button>
                  </div>
                </div>
              ) : ["approved", "payment_pending", "payment_failed"].includes(quote.status) ? (
                <div>
                  <h2 className="text-lg font-semibold">Complete payment</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {quote.status === "payment_failed" ? "Your previous payment did not go through. You can try again." : "You approved this quote. Complete payment securely to confirm the work."}
                  </p>
                  {clientSecret && stripePromise && paymentOptions ? (
                    <div className="mt-5">
                      <Elements stripe={stripePromise} options={paymentOptions}>
                        <QuotePaymentForm amount={Number(quote.totalAmount)} onPaymentSubmitted={handlePaymentSubmitted} />
                      </Elements>
                    </div>
                  ) : (
                    <Button
                      className="mt-5 w-full"
                      disabled={createPaymentIntent.isPending}
                      onClick={() => void handleStartPayment()}
                    >
                      {createPaymentIntent.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparing secure payment...</>
                      ) : (
                        <><CreditCard className="mr-2 h-4 w-4" />Continue to payment</>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">This quote is not available for payment.</p>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { workflowLabels, workflowKinds } from "@shared/referralWorkflow";
import { toast } from "sonner";

export function ReferralAttention() {
  const config = trpc.referralWorkflow.config.useQuery(undefined, {
    staleTime: 60000,
    retry: false,
  });
  const summary = trpc.referralWorkflow.summary.useQuery(undefined, {
    enabled: config.data?.enabled === true,
    retry: false,
  });
  if (!config.data?.enabled) return null;
  return (
    <section className="mb-5 rounded-lg border p-4">
      <h3 className="font-semibold">Referral next actions</h3>
      <p className="text-xs text-muted-foreground my-2">
        Based on saved progress and quote status. No reminders are sent
        automatically.
      </p>
      {summary.isPending ? (
        <p>Loading next actions…</p>
      ) : summary.isError ? (
        <p role="alert">
          Could not load next actions.{" "}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void summary.refetch()}
          >
            Retry
          </Button>
        </p>
      ) : summary.data?.length ? (
        <ul className="space-y-2 text-sm">
          {summary.data.map(item => (
            <li key={item.id}>
              <a
                className="text-primary underline"
                href={`#referral-${item.id}`}
              >
                {item.title}
              </a>
              : {item.nextAction}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">No open referrals need tracking.</p>
      )}
    </section>
  );
}

type Props = {
  referralJobId: number;
  status: string;
  admin?: boolean;
  candidates?: { userId: number; userName: string | null }[];
};
export function ReferralWorkflow({
  referralJobId,
  status,
  admin = false,
  candidates = [],
}: Props) {
  const config = trpc.referralWorkflow.config.useQuery(undefined, {
    staleTime: 60000,
    retry: false,
  });
  const [open, setOpen] = useState(false);
  const [kind, setKind] =
    useState<(typeof workflowKinds)[number]>("customer_contacted");
  const [note, setNote] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const utils = trpc.useUtils();
  const allowed = admin || !["sent", "declined", "cancelled"].includes(status);
  const query = trpc.referralWorkflow.get.useQuery(
    { referralJobId },
    { enabled: config.data?.enabled === true && open && allowed, retry: false }
  );
  const add = trpc.referralWorkflow.add.useMutation({
    onSuccess: async () => {
      setNote("");
      setScheduledAt("");
      toast.success("Progress saved.");
      await Promise.all([
        utils.referralWorkflow.get.invalidate({ referralJobId }),
        utils.referralWorkflow.summary.invalidate(),
      ]);
    },
    onError: error => toast.error(error.message),
  });
  if (!config.data?.enabled || !allowed) return null;
  const outreach = ["outreach_sent", "interested", "unavailable"].includes(
    kind
  );
  const canUpdate =
    !["completed", "cancelled"].includes(status) &&
    (admin || query.data?.canUpdate);
  const inputClass =
    "w-full rounded-md border border-input bg-background p-2 text-sm";
  return (
    <details
      className="mt-4 border-t pt-3 text-sm"
      onToggle={event => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-medium text-primary">
        Progress, outreach and linked quotes
      </summary>
      {open &&
        (query.isPending ? (
          <p className="mt-3">Loading progress…</p>
        ) : query.isError ? (
          <p role="alert" className="mt-3">
            Could not load progress.{" "}
            <Button
              size="sm"
              variant="outline"
              onClick={() => void query.refetch()}
            >
              Retry
            </Button>
          </p>
        ) : (
          <div className="space-y-4 mt-3">
            <p className="rounded-md bg-muted p-3">
              {query.data?.nextAction ?? "This referral is closed."}
            </p>
            {!!query.data?.quotes.length && (
              <div>
                <h4 className="font-medium">Linked quotes</h4>
                <ul className="space-y-1 mt-1">
                  {query.data.quotes.map(q => (
                    <li key={q.id}>
                      Quote #{q.id} · {q.status.replaceAll("_", " ")} · $
                      {Number(q.totalAmount).toFixed(2)} CAD
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {canUpdate && (
              <form
                className="space-y-3"
                onSubmit={event => {
                  event.preventDefault();
                  const visitDate = scheduledAt
                    ? new Date(scheduledAt)
                    : undefined;
                  if (
                    kind === "visit_booked" &&
                    (!visitDate || Number.isNaN(visitDate.getTime()))
                  ) {
                    toast.error("Enter a valid visit date.");
                    return;
                  }
                  add.mutate({
                    referralJobId,
                    kind,
                    note,
                    ...(outreach ? { candidateId: Number(candidateId) } : {}),
                    ...(kind === "visit_booked"
                      ? { scheduledAt: visitDate }
                      : {}),
                  });
                }}
              >
                <fieldset disabled={add.isPending} className="space-y-3">
                  <label className="block">
                    Update
                    <select
                      className={inputClass}
                      value={kind}
                      onChange={e => setKind(e.target.value as typeof kind)}
                    >
                      {workflowKinds
                        .filter(
                          k =>
                            admin ||
                            [
                              "customer_contacted",
                              "visit_booked",
                              "note",
                            ].includes(k)
                        )
                        .map(k => (
                          <option key={k} value={k}>
                            {workflowLabels[k]}
                          </option>
                        ))}
                    </select>
                  </label>
                  {outreach && (
                    <>
                      <label className="block">
                        Handyman contacted
                        <select
                          className={inputClass}
                          required
                          value={candidateId}
                          onChange={e => setCandidateId(e.target.value)}
                        >
                          <option value="">Select handyman</option>
                          {candidates.map(c => (
                            <option key={c.userId} value={c.userId}>
                              {c.userName || `Handyman #${c.userId}`}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Records outreach you have already made. Does not send a
                        message, assign the job or share customer details.
                      </p>
                    </>
                  )}
                  {kind === "visit_booked" && (
                    <label className="block">
                      Visit date and time (your local time)
                      <input
                        className={inputClass}
                        required
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                      />
                    </label>
                  )}
                  <label className="block">
                    {admin ? "Private admin note" : "Note for SaskHandy"}
                    <textarea
                      className={inputClass}
                      maxLength={2000}
                      required={kind === "note"}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Availability, contact outcome or next step"
                    />
                  </label>
                  <Button size="sm" type="submit">
                    {add.isPending ? "Saving…" : "Save progress"}
                  </Button>
                </fieldset>
              </form>
            )}
            <div>
              <h4 className="font-medium">Activity history</h4>
              {query.data?.events.length ? (
                <ol className="mt-2 space-y-3">
                  {query.data.events.map(event => (
                    <li key={event.id} className="border-l-2 pl-3">
                      <p className="font-medium">
                        {workflowLabels[event.kind]}
                        {event.candidateId
                          ? ` · ${event.candidateName || `Handyman #${event.candidateId}`}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                      {event.scheduledAt && (
                        <p>
                          Visit: {new Date(event.scheduledAt).toLocaleString()}
                        </p>
                      )}
                      {event.note && (
                        <p className="whitespace-pre-wrap break-words">
                          {event.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted-foreground mt-1">
                  No progress entries recorded yet. Earlier messages are not
                  imported.
                </p>
              )}
            </div>
          </div>
        ))}
    </details>
  );
}

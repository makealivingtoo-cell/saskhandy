import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Internal activity log only. Creating an entry sends no email/SMS and changes no job/payment state. */
export function ReferralActivity({
  referralJobId,
  role,
  readOnly = false,
}: {
  referralJobId: number;
  role: "admin" | "handyman";
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [kind, setKind] = useState<"outreach" | "contacted" | "inspection" | "note">(
    role === "admin" ? "outreach" : "contacted"
  );
  const [note, setNote] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  // Keep hooks unconditional. Only the appropriate authorized endpoint runs.
  const adminActivity = trpc.admin.getReferralActivity.useQuery(
    { referralJobId },
    { enabled: expanded && role === "admin", retry: false }
  );
  const handymanActivity = trpc.referralJobs.getActivity.useQuery(
    { referralJobId },
    { enabled: expanded && role === "handyman", retry: false }
  );
  const adminSave = trpc.admin.recordReferralActivity.useMutation();
  const handymanSave = trpc.referralJobs.recordActivity.useMutation();

  const query = role === "admin" ? adminActivity : handymanActivity;
  const records = query.data ?? [];
  const saving = adminSave.isPending || handymanSave.isPending;

  async function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (note.trim().length < 3 || note.trim().length > 1500) {
      toast.error("Enter a progress note between 3 and 1,500 characters.");
      return;
    }
    let time: string | null = null;
    if (kind === "inspection" && scheduledFor) {
      const parsed = new Date(scheduledFor);
      if (Number.isNaN(parsed.getTime())) {
        toast.error("Enter a valid inspection date and time.");
        return;
      }
      time = parsed.toISOString();
    }
    try {
      if (role === "admin") {
        await adminSave.mutateAsync({ referralJobId, type: kind, note: note.trim(), scheduledFor: time });
        await adminActivity.refetch();
      } else {
        if (kind === "outreach") return;
        await handymanSave.mutateAsync({ referralJobId, type: kind, note: note.trim(), scheduledFor: time });
        await handymanActivity.refetch();
      }
      setNote("");
      setScheduledFor("");
      toast.success("Progress note saved. No message was sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the progress note.");
    }
  }

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <button
        type="button"
        className="text-sm text-primary hover:underline font-medium"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Hide activity" : "View / log activity"}
      </button>
      {expanded && (
        <div className="mt-3 space-y-4">
          {query.isLoading ? (
            <p className="text-xs text-muted-foreground">Loading activity...</p>
          ) : query.isError ? (
            <div className="text-xs text-red-700" role="alert">
              Could not load the activity log. Check that the referral activity database migration has run.
              <Button size="sm" type="button" variant="outline" className="ml-2" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </div>
          ) : records.length === 0 ? (
            <p className="text-xs text-muted-foreground">No updates recorded yet.</p>
          ) : (
            <ol className="space-y-2 border-l-2 border-border/60 pl-3">
              {records.map((record) => (
                <li key={record.id} className="text-xs">
                  <p className="font-medium capitalize">
                    {record.type === "contacted" ? "Homeowner contacted" : record.type === "inspection" ? "Inspection scheduled" : record.type}
                    {record.privateToAdmin ? " · Admin only" : ""}
                  </p>
                  <p className="text-muted-foreground">{format(new Date(record.createdAt), "MMM d, yyyy h:mm a")}</p>
                  {record.scheduledFor && <p>Visit: {format(new Date(record.scheduledFor), "MMM d, yyyy h:mm a")}</p>}
                  <p className="mt-1 whitespace-pre-wrap break-words">{record.note}</p>
                </li>
              ))}
            </ol>
          )}
          {!readOnly && (
            <form className="space-y-2" onSubmit={(event) => void saveActivity(event)}>
              <label className="block text-xs font-medium">
                Update type
                <select
                  className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as typeof kind)}
                >
                  {role === "admin" && <option value="outreach">Handyman outreach (private)</option>}
                  <option value="contacted">Homeowner contacted</option>
                  <option value="inspection">Inspection / visit booked</option>
                  <option value="note">Progress note</option>
                </select>
              </label>
              {kind === "inspection" && (
                <label className="block text-xs font-medium">
                  Visit date and time (optional)
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </label>
              )}
              <label className="block text-xs font-medium">
                Details
                <textarea
                  rows={2}
                  minLength={3}
                  maxLength={1500}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={role === "admin" ? "Who you contacted and what they said..." : "What you agreed with the homeowner..."}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                />
              </label>
              <p className="text-xs text-muted-foreground">
                {role === "admin" ? "Private to SaskHandy admin. " : "Visible to you and SaskHandy admin. "}
                Logging a note does not send messages or update payment status.
              </p>
              <Button size="sm" type="submit" disabled={saving || query.isError || note.trim().length < 3}>
                {saving ? "Saving..." : "Save update"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

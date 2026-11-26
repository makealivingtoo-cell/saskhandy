import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Job statuses
  open: { label: "Open", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", className: "bg-gray-50 text-gray-600 border-gray-200" },
  disputed: { label: "Disputed", className: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "Cancelled", className: "bg-orange-50 text-orange-600 border-orange-200" },
  awaiting_payment: { label: "Payment required", className: "bg-amber-50 text-amber-800 border-amber-200" },
  payment_pending: { label: "Payment pending", className: "bg-amber-50 text-amber-800 border-amber-200" },
  payment_failed: { label: "Payment unsuccessful", className: "bg-red-50 text-red-700 border-red-200" },
  quote_sent: { label: "Quote sent", className: "bg-blue-50 text-blue-700 border-blue-200" },
  // Quote statuses
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-600 border-red-200" },
  // Payment statuses
  refunded: { label: "Refunded", className: "bg-purple-50 text-purple-700 border-purple-200" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status.replaceAll("_"," ").replace(/^./,c=>c.toUpperCase()), className: "bg-gray-50 text-gray-600 border-gray-200" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

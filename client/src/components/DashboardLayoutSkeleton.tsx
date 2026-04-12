import { cn } from "@/lib/utils";

interface DashboardLayoutSkeletonProps {
  title?: boolean;
  subtitle?: boolean;
  headerAction?: boolean;
  statCards?: number;
  showSidebar?: boolean;
  contentRows?: number;
  className?: string;
}

function SkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return <div className={cn("animate-pulse rounded-xl bg-muted/60", className)} />;
}

export default function DashboardLayoutSkeleton({
  title = true,
  subtitle = true,
  headerAction = true,
  statCards = 4,
  showSidebar = false,
  contentRows = 4,
  className,
}: DashboardLayoutSkeletonProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="container py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3 flex-1">
              {title && <SkeletonBlock className="h-8 w-56" />}
              {subtitle && <SkeletonBlock className="h-4 w-80 max-w-full" />}
            </div>

            {headerAction && <SkeletonBlock className="h-10 w-36 shrink-0" />}
          </div>

          {statCards > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: statCards }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-border/60 shadow-sm p-5"
                >
                  <div className="flex items-center gap-4">
                    <SkeletonBlock className="w-11 h-11 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonBlock className="h-6 w-16" />
                      <SkeletonBlock className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSidebar ? (
            <div className="grid lg:grid-cols-[320px_1fr] gap-6">
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 space-y-4">
                <SkeletonBlock className="h-6 w-32" />
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonBlock key={index} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
                <SkeletonBlock className="h-7 w-40" />
                <SkeletonBlock className="h-4 w-64" />

                <div className="space-y-4 pt-2">
                  {Array.from({ length: contentRows }).map((_, index) => (
                    <div
                      key={index}
                      className="border border-border/60 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <SkeletonBlock className="h-5 w-40" />
                        <SkeletonBlock className="h-5 w-20 rounded-full" />
                      </div>
                      <SkeletonBlock className="h-4 w-full" />
                      <SkeletonBlock className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
              <SkeletonBlock className="h-7 w-40" />
              <SkeletonBlock className="h-4 w-72 max-w-full" />

              <div className="space-y-4 pt-2">
                {Array.from({ length: contentRows }).map((_, index) => (
                  <div
                    key={index}
                    className="border border-border/60 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="space-y-2 flex-1">
                        <SkeletonBlock className="h-5 w-44" />
                        <SkeletonBlock className="h-4 w-72 max-w-full" />
                      </div>
                      <SkeletonBlock className="h-6 w-20 rounded-full shrink-0" />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <SkeletonBlock className="h-16 w-full" />
                      <SkeletonBlock className="h-16 w-full" />
                      <SkeletonBlock className="h-16 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
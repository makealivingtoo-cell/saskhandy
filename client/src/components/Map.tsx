import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapViewProps {
  className?: string;
  locationQuery?: string;
  title?: string;
  heightClassName?: string;
}

function buildMapUrl(locationQuery: string) {
  const encoded = encodeURIComponent(locationQuery.trim());
  return `https://www.google.com/maps?q=${encoded}&z=14&output=embed`;
}

function buildOpenMapsUrl(locationQuery: string) {
  const encoded = encodeURIComponent(locationQuery.trim());
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

export function MapView({
  className,
  locationQuery,
  title = "Job Location",
  heightClassName = "h-[320px]",
}: MapViewProps) {
  const hasLocation = !!locationQuery?.trim();

  if (!hasLocation) {
    return (
      <div
        className={cn(
          "w-full rounded-2xl border border-border/60 bg-muted/30 p-6 text-center",
          heightClassName,
          "flex items-center justify-center",
          className
        )}
      >
        <div>
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">{title}</p>
          <p className="text-sm text-muted-foreground">
            Add a location to preview it on the map.
          </p>
        </div>
      </div>
    );
  }

  const mapUrl = buildMapUrl(locationQuery);
  const openMapsUrl = buildOpenMapsUrl(locationQuery);

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{locationQuery}</p>
        </div>

        <a
          href={openMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
        >
          Open in Maps
        </a>
      </div>

      <div className={cn("w-full overflow-hidden rounded-2xl border border-border/60", heightClassName)}>
        <iframe
          title={title}
          src={mapUrl}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

export default MapView;
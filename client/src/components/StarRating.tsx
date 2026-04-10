import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingDisplayProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function StarRatingDisplay({
  rating,
  max = 5,
  size = "md",
  showValue = false,
  className,
}: StarRatingDisplayProps) {
  const sizeClass = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" }[size];
  const filled = Math.round(rating);

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(sizeClass, i < filled ? "fill-amber-400 text-amber-400" : "fill-none text-gray-300")}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground font-medium">{Number(rating).toFixed(1)}</span>
      )}
    </span>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
  className?: string;
}

export function StarRatingInput({ value, onChange, max = 5, className }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= (hovered || value);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={cn(
                "w-7 h-7 transition-colors",
                isActive ? "fill-amber-400 text-amber-400" : "fill-none text-gray-300 hover:text-amber-300"
              )}
            />
          </button>
        );
      })}
    </span>
  );
}

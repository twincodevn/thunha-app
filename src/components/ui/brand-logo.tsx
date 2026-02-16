import { cn } from "@/lib/utils";

interface BrandLogoProps {
    className?: string;
    variant?: "default" | "white" | "gradient";
}

export function BrandLogo({ className, variant = "default" }: BrandLogoProps) {
    const isWhite = variant === "white";
    // For now, treat gradient as just the primary brand color to avoid SVG ID collision issues causing invisibility.
    // We can add intricate gradients later if needed, but visibility is priority.
    const strokeColor = isWhite ? "currentColor" : "#2563EB"; // Blue-600

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className={cn("h-8 w-8 text-blue-600", isWhite && "text-white", className)}
            aria-label="ThuNhà Logo"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* Abstract House Shape - Modern & Minimalist - Filled a bit for weight? No, stroke is elegant. */}
            <path
                d="M3 9.5L12 2.5L21 9.5V20.5C21 21.0523 20.5523 21.5 20 21.5H15M9 21.5H4C3.44772 21.5 3 21.0523 3 20.5V9.5Z"
            />
            {/* The "T" or "Upward" arrow inside */}
            <path
                d="M9 21.5V14H15V21.5"
            />
            {/* Accent Dot - 'Top 1' - Solid Green for contrast/status */}
            <circle
                cx="18"
                cy="5"
                r="2"
                fill={isWhite ? "currentColor" : "#10B981"} // Green-500
                stroke="none"
            />
        </svg>
    );
}

import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-9", className)}>
      <circle cx="20" cy="20" r="19" className="fill-forest" />
      <path
        d="M20 8c6.5 4.2 9.5 9.3 9.5 14.2A9.5 9.5 0 0 1 20 31.7a9.5 9.5 0 0 1-9.5-9.5C10.5 17.3 13.5 12.2 20 8Z"
        className="fill-leaf"
      />
      <path d="M20 31.5V17.5M20 22.5l-4-3.5M20 26l4.5-3.8" className="stroke-forest-deep" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Alerta Verde — página inicial">
      <LogoMark />
      <span className="leading-none">
        <span className={cn("block font-display text-xl font-semibold", inverted ? "text-primary-foreground" : "text-forest-deep")}>
          Alerta Verde
        </span>
        <span className={cn("block text-[0.68rem] font-semibold uppercase tracking-[0.18em]", inverted ? "text-leaf" : "text-forest")}>
          Itabirito · MG
        </span>
      </span>
    </Link>
  );
}

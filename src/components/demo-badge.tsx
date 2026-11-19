import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoBadge({ children = "Dados demonstrativos", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-demo px-2.5 py-1 text-xs font-semibold text-demo-foreground", className)}>
      <Info className="size-3.5" /> {children}
    </span>
  );
}

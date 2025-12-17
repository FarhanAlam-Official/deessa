import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  value: string
  label: string
  iconColor?: string
  bgColor?: string
  className?: string
}

export function StatCard({
  icon: Icon,
  value,
  label,
  iconColor = "text-primary",
  bgColor = "bg-red-50",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group",
        className,
      )}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110",
          bgColor,
        )}
      />
      <Icon className={cn("size-10 mb-4 relative z-10", iconColor)} />
      <div className="flex flex-col relative z-10">
        <span className="text-4xl font-black text-foreground tracking-tight">{value}</span>
        <span className="text-sm font-bold text-foreground-muted uppercase tracking-wide mt-1">{label}</span>
      </div>
    </div>
  )
}

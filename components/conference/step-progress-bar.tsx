"use client"

interface StepProgressBarProps {
  step: number
  total: number
  label: string
}

export function StepProgressBar({ step, total, label }: StepProgressBarProps) {
  const pct = Math.round((step / total) * 100)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Step {step} of {total}:{" "}
          <span className="font-bold text-foreground">{label}</span>
        </p>
        <p className="text-sm font-medium text-foreground-muted">{pct}%</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

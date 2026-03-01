"use client"

interface StepProgressBarProps {
  step: number
  total: number
  label: string
}

export function StepProgressBar({ step, total, label }: StepProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((step / total) * 100)) : 0
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Step {step} of {total}:{" "}
          <span className="font-bold text-foreground">{label}</span>
        </p>
        <p className="text-sm font-medium text-foreground-muted">{pct}%</p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct}% complete`}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>    </div>
  )
}

"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PrintButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function PrintButton({ 
  variant = "outline", 
  size = "default",
  className,
  children 
}: PrintButtonProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handlePrint}
      className={cn("gap-2", className)}
    >
      <Printer className="size-4" />
      {children || "Print"}
    </Button>
  )
}

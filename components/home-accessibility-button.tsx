"use client"

import { useState, useEffect } from "react"
import { Accessibility, Type, Contrast, ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function HomeAccessibilityButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100)
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`
    return () => {
      document.documentElement.style.fontSize = ""
    }
  }, [fontSize])

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add("high-contrast")
    } else {
      document.body.classList.remove("high-contrast")
    }
  }, [highContrast])

  const resetAll = () => {
    setFontSize(100)
    setHighContrast(false)
  }

  return (
    <>
      {/* Floating button on right side */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 px-3 py-4 rounded-l-2xl shadow-2xl transition-all duration-300 group",
          isOpen
            ? "bg-primary text-white"
            : "bg-primary text-white hover:pr-5"
        )}
        aria-label="Accessibility options"
        title="Accessibility options"
      >
        <Accessibility className="size-6" />
        <span className="text-xs font-bold writing-mode-vertical hidden sm:block" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
          Accessibility
        </span>
      </button>

      {/* Accessibility panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 mr-14 bg-background border border-border rounded-2xl shadow-2xl p-6 w-72 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-foreground text-lg flex items-center gap-2">
                <Accessibility className="size-5 text-primary" />
                Accessibility
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close accessibility panel"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Font Size */}
              <div>
                <label className="text-sm font-bold text-foreground/70 mb-2 block">
                  <Type className="size-4 inline mr-1.5" />
                  Text Size ({fontSize}%)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize((prev) => Math.max(80, prev - 10))}
                    className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center hover:bg-primary/10 transition-colors"
                    aria-label="Decrease font size"
                  >
                    <ZoomOut className="size-4" />
                  </button>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((fontSize - 80) / 60) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setFontSize((prev) => Math.min(140, prev + 10))}
                    className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center hover:bg-primary/10 transition-colors"
                    aria-label="Increase font size"
                  >
                    <ZoomIn className="size-4" />
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                    highContrast
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-border text-foreground/70 hover:border-primary/30"
                  )}
                >
                  <Contrast className="size-5" />
                  <span className="font-bold text-sm">High Contrast</span>
                  <span className={cn(
                    "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
                    highContrast ? "bg-primary text-white" : "bg-border text-foreground/50"
                  )}>
                    {highContrast ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              {/* Reset */}
              <button
                onClick={resetAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-all text-sm font-bold"
              >
                <RotateCcw className="size-4" />
                Reset All
              </button>
            </div>

            <p className="text-xs text-foreground/40 mt-4 text-center leading-relaxed">
              These tools help ensure all users can perceive, understand, and interact with our content comfortably.
            </p>
          </div>
        </>
      )}
    </>
  )
}

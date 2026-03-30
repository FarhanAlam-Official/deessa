"use client"

import { useState, useEffect } from "react"
import { Accessibility, Type, Contrast, ZoomIn, ZoomOut, RotateCcw, X, Pause, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

export function HomeAccessibilityButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100)
  const [highContrast, setHighContrast] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [calmingMode, setCalmingMode] = useState(false)

  // Font size effect
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`
    return () => {
      document.documentElement.style.fontSize = ""
    }
  }, [fontSize])

  // High contrast effect
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add("high-contrast")
    } else {
      document.body.classList.remove("high-contrast")
    }
  }, [highContrast])

  // Reduced motion effect
  useEffect(() => {
    if (reduceMotion) {
      document.body.classList.add("reduce-motion")
    } else {
      document.body.classList.remove("reduce-motion")
    }
  }, [reduceMotion])

  // Calming mode effect
  useEffect(() => {
    if (calmingMode) {
      document.body.classList.add("calming-mode")
    } else {
      document.body.classList.remove("calming-mode")
    }
  }, [calmingMode])

  const resetAll = () => {
    setFontSize(100)
    setHighContrast(false)
    setReduceMotion(false)
    setCalmingMode(false)
  }

  return (
    <>
      {/* Floating button on right side */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-0 top-[38%] -translate-y-1/2 z-50 flex items-center gap-2 px-3 py-4 rounded-l-2xl shadow-2xl transition-all duration-300 group",
          isOpen
            ? "bg-primary text-white"
            : "bg-primary text-white hover:pr-5"
        )}
        aria-label="Accessibility options"
        title="Accessibility options"
      >
        <Accessibility className="w-6 h-6" />
        <span className="text-xs font-bold hidden sm:block" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
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
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 mr-14 bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-80 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-primary" />
                Accessibility
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close accessibility panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Font Size */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  <Type className="w-4 h-4 inline mr-1.5" />
                  Text Size ({fontSize}%)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize((prev) => Math.max(80, prev - 10))}
                    className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-primary/10 transition-colors"
                    aria-label="Decrease font size"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((fontSize - 80) / 60) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setFontSize((prev) => Math.min(140, prev + 10))}
                    className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-primary/10 transition-colors"
                    aria-label="Increase font size"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                  highContrast
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-primary/30"
                )}
              >
                <Contrast className="w-5 h-5" />
                <span className="font-semibold text-sm">High Contrast</span>
                <span className={cn(
                  "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
                  highContrast ? "bg-primary text-white" : "bg-slate-200 text-slate-500"
                )}>
                  {highContrast ? "ON" : "OFF"}
                </span>
              </button>

              {/* Reduced Motion */}
              <button
                onClick={() => setReduceMotion(!reduceMotion)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                  reduceMotion
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-primary/30"
                )}
              >
                <Pause className="w-5 h-5" />
                <span className="font-semibold text-sm">Reduce Motion</span>
                <span className={cn(
                  "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
                  reduceMotion ? "bg-primary text-white" : "bg-slate-200 text-slate-500"
                )}>
                  {reduceMotion ? "ON" : "OFF"}
                </span>
              </button>

              {/* Calming Mode */}
              <button
                onClick={() => setCalmingMode(!calmingMode)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                  calmingMode
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-primary/30"
                )}
              >
                <Palette className="w-5 h-5" />
                <span className="font-semibold text-sm">Calming Mode</span>
                <span className={cn(
                  "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
                  calmingMode ? "bg-primary text-white" : "bg-slate-200 text-slate-500"
                )}>
                  {calmingMode ? "ON" : "OFF"}
                </span>
              </button>

              {/* Reset */}
              <button
                onClick={resetAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-all text-sm font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center leading-relaxed">
              These tools help ensure all users can perceive, understand, and interact with our content comfortably.
            </p>
          </div>
        </>
      )}
    </>
  )
}

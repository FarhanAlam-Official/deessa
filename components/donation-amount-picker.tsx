"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const amounts = [
  { value: 500, label: "NPR 500", impact: "School supplies for 5 children" },
  { value: 1000, label: "NPR 1,000", impact: "Medical checkup for a village" },
  { value: 2500, label: "NPR 2,500", impact: "Teacher training workshop" },
  { value: 5000, label: "NPR 5,000", impact: "Build a classroom library" },
]

export function DonationAmountPicker() {
  const [selected, setSelected] = useState(1)

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="grid grid-cols-2 gap-3">
        {amounts.map((item, i) => (
          <button
            key={item.value}
            onClick={() => setSelected(i)}
            className={cn(
              "relative rounded-2xl p-5 text-left transition-all duration-300 border-2",
              i === selected
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]"
                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
            )}
          >
            <div className={cn("text-2xl font-black mb-1", i === selected ? "text-primary" : "text-white")}>
              {item.label}
            </div>
            <p className="text-sm text-gray-300 leading-snug">{item.impact}</p>
            {i === selected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Heart className="size-3 text-white fill-current" />
              </div>
            )}
          </button>
        ))}
      </div>
      <Button
        asChild
        size="lg"
        className="rounded-full h-14 px-8 w-full text-base font-bold shadow-xl mt-2"
      >
        <Link href={`/donate?amount=${amounts[selected].value}`}>
          Donate {amounts[selected].label}
          <Heart className="ml-2 size-5 fill-current" />
        </Link>
      </Button>
    </div>
  )
}

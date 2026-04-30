"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

interface Program {
  id: string
  category: string
  categoryLabel: string
  categoryColor: string
  image: string
  title: string
  description: string
  stat: string
  slug: string
}

interface ProgramsClientProps {
  programs: Program[]
}

const categories = [
  { id: "all", label: "All Programs" },
  { id: "education", label: "Education" },
  { id: "healthcare", label: "Healthcare" },
  { id: "empowerment", label: "Empowerment" },
  { id: "relief", label: "Relief" },
  { id: "autism", label: "Autism Support" },
  { id: "training", label: "Training" },
]

export function ProgramsClient({ programs }: ProgramsClientProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredPrograms =
    activeCategory === "all"
      ? programs
      : programs.filter((program) => program.category === activeCategory)

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-5 py-2.5 rounded-full font-['Comic_Neue'] font-bold text-[14px] transition-all duration-300 ${
              activeCategory === cat.id
                ? "bg-[#29b6c8] text-white shadow-lg"
                : "bg-white text-[#1a1a2e] border-[1.5px] border-[#1a1a2e] hover:border-[#29b6c8]"
            }`}
          >
            {cat.id === "autism" && "🧩 "}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Programs Grid */}
      <AnimatePresence mode="wait">
        {filteredPrograms.length > 0 ? (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Image with Category Badge */}
                <div className="relative h-[200px] overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Category Badge */}
                  <div
                    className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full ${program.categoryColor} text-white text-[11px] font-['Comic_Neue'] font-bold tracking-wide shadow-lg`}
                  >
                    {program.categoryLabel}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-[22px] font-['Marissa'] text-[#1a1a2e] mb-3 leading-tight">
                    {program.title}
                  </h3>
                  <p className="text-[15px] font-['DM_Sans'] text-[#1a1a2e]/70 mb-4 leading-relaxed line-clamp-2">
                    {program.description}
                  </p>
                  
                  {/* Stat */}
                  <div className="mb-4 text-[13px] font-['DM_Sans'] font-semibold text-[#29b6c8]">
                    {program.stat}
                  </div>

                  {/* Learn More Link */}
                  <Link
                    href={`/programs/${program.slug}`}
                    className="inline-flex items-center text-[14px] font-['Comic_Neue'] font-bold text-[#29b6c8] hover:text-[#1a8fa0] transition-colors"
                  >
                    Learn More →
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-[28px] font-['Marissa'] text-[#1a1a2e] mb-3">
              No programs in this category yet.
            </h3>
            <p className="text-[16px] font-['DM_Sans'] text-[#1a1a2e]/60 mb-6">
              Check back soon or explore all programs.
            </p>
            <button
              onClick={() => setActiveCategory("all")}
              className="px-6 py-3 rounded-full bg-[#29b6c8] text-white font-['Comic_Neue'] font-bold text-[14px] hover:bg-[#1a8fa0] transition-colors"
            >
              View All Programs
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

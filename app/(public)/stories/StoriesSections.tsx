"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Camera } from "lucide-react"
import { motion } from "framer-motion"

interface Story {
  id: string
  title: string
  slug: string
  excerpt: string
  image: string | null
  category: string | null
  is_featured: boolean
  published_at: string | null
  created_at: string | null
  read_time: string | null
  formattedDate?: string
}

interface StoriesSectionsProps {
  primaryStory: Story | null
  activeFilter: string
  spotlightMainStory: Story | null
  spotlightSideStories: Story[]
  remainingStories: Story[]
}

export function StoriesSections({
  primaryStory,
  activeFilter,
  spotlightMainStory,
  spotlightSideStories,
  remainingStories,
}: StoriesSectionsProps) {
  // Animation variants for featured story
  const imageVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  }

  // Animation variants for story cards
  const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  }

  return (
    <>
      {/* ═══════════════════════════════════════════
          SECTION 2 — FEATURED STORY (Fixed Layout)
      ═══════════════════════════════════════════ */}
      <section id="featured" className="bg-[#f8f6f1] py-20">
        <div className="mx-auto max-w-6xl px-6">
          {primaryStory ? (
            <div className="grid gap-12 lg:grid-cols-[45%_55%] items-center">
              {/* LEFT — Image side */}
              <motion.div
                variants={imageVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="relative"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                  <Image
                    src={primaryStory.image || "/StoriesSectionImage.png"}
                    alt={primaryStory.title}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
                {/* Featured badge overlaid on image */}
                <div className="absolute bottom-4 left-4">
                  <span className="font-comic inline-block rounded-full bg-teal px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    FEATURED STORY
                  </span>
                </div>
              </motion.div>

              {/* RIGHT — Text side */}
              <motion.div
                variants={textVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                style={{ paddingLeft: 48 }}
              >
                {/* Section label */}
                <p className="font-comic text-teal text-xs font-bold uppercase tracking-widest">
                  FEATURED STORY
                </p>

                {/* H2 */}
                <h2 className="font-marissa mt-4 text-[#1a1a2e]" style={{ fontSize: 44, lineHeight: 1.2 }}>
                  {primaryStory.title}
                </h2>

                {/* Divider line */}
                <div className="mt-4 h-[3px] w-10 rounded-full bg-teal"></div>

                {/* Body text */}
                <div className="font-dm mt-6 space-y-4 text-[#4a4a4a]" style={{ fontSize: 17, lineHeight: 1.8 }}>
                  <p>{primaryStory.excerpt}</p>

                  {/* Pull quote */}
                  <blockquote className="font-marissa my-6 border-l-[3px] border-teal bg-teal/10 py-4 px-6 italic text-[#1a1a2e]" style={{ fontSize: 20, lineHeight: 1.6 }}>
                    "Every child deserves a path that celebrates their potential, not their limitations."
                  </blockquote>

                  <p>
                    The featured section stays immersive without becoming a separate story page. It gives one story room to stand out, while the list below keeps the rest of the page compact and scannable.
                  </p>
                </div>

                {/* Outcome pills */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="font-comic inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-xs font-medium">
                    🎓 Education Access
                  </span>
                  <span className="font-comic inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-xs font-medium">
                    ❤️ Family Support
                  </span>
                  <span className="font-comic inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-xs font-medium">
                    🌱 Community Change
                  </span>
                </div>

                {/* Read Full Story link */}
                <Link
                  href={`/stories/${primaryStory.slug}`}
                  className="font-comic mt-6 inline-flex items-center gap-2 text-sm font-bold text-teal transition-colors hover:text-[#1a8fa0]"
                >
                  Read Full Story
                  <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
              <p className="font-comic text-teal text-xs font-bold uppercase tracking-widest">No Featured Story</p>
              <h3 className="font-marissa mt-3 text-2xl text-[#1a1a2e]">This section is ready for the next published story.</h3>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — WRITTEN STORIES GRID (Fixed Cards)
      ═══════════════════════════════════════════ */}
      <section id="stories" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          {/* Section header */}
          <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-comic text-teal text-xs font-bold uppercase tracking-widest">WRITTEN STORIES</p>
              <h2 className="font-marissa mt-3 text-[#1a1a2e]" style={{ fontSize: 42, lineHeight: 1.2 }}>
                Narratives of Unfolding Potential
              </h2>
              <p className="font-dm mt-3 text-muted-foreground" style={{ fontSize: 16 }}>
                The strongest stories here combine quiet confidence, family support, and visible progress.
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-3">
              {[
                { key: "all", label: "ALL STORIES" },
                { key: "latest", label: "LATEST" },
                { key: "featured", label: "FEATURED" },
              ].map((option) => {
                const isActive = activeFilter === option.key
                return (
                  <Link
                    key={option.key}
                    href={option.key === "all" ? "/stories#stories" : `/stories?filter=${option.key}#stories`}
                    className={
                      isActive
                        ? "font-comic rounded-full bg-teal px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all"
                        : "font-comic rounded-full border border-gray-300 bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 transition-all hover:border-teal"
                    }
                  >
                    {option.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Stories grid */}
          {spotlightMainStory ? (
            <motion.div
              variants={cardContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid gap-6 lg:grid-cols-[60%_40%]"
            >
              {/* LARGE CARD (left) */}
              <motion.div variants={cardVariants}>
                <Link href={`/stories/${spotlightMainStory.slug}`} className="group">
                  <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {spotlightMainStory.image ? (
                        <Image
                          src={spotlightMainStory.image}
                          alt={spotlightMainStory.title}
                          fill
                          sizes="(min-width: 1024px) 55vw, 100vw"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e0f7fa] to-[#b2ebf2]">
                          <Camera className="size-16 text-teal/40" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <span className="font-comic inline-block rounded-full bg-teal px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                        {spotlightMainStory.category || "AUTISM CARE"}
                      </span>
                      <h3 className="font-marissa mt-4 text-[#1a1a2e] transition-colors group-hover:text-teal" style={{ fontSize: 28, lineHeight: 1.3 }}>
                        {spotlightMainStory.title}
                      </h3>
                      <p className="font-dm mt-3 text-muted-foreground line-clamp-2" style={{ fontSize: 15 }}>
                        {spotlightMainStory.excerpt}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-dm text-xs text-gray-500">{spotlightMainStory.formattedDate}</span>
                        <span className="font-comic text-teal text-sm font-bold">Read story →</span>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>

              {/* SMALL CARDS (right sidebar) */}
              <motion.div variants={cardVariants} className="space-y-4">
                {spotlightSideStories.map((story, index) => (
                  <Link key={story.id} href={`/stories/${story.slug}`} className="group block">
                    <article className={`flex gap-4 pb-4 ${index < spotlightSideStories.length - 1 ? 'border-b border-gray-200' : ''}`}>
                      {/* Small image left */}
                      <div className="relative h-[100px] w-[100px] flex-shrink-0 overflow-hidden rounded-xl">
                        {story.image ? (
                          <Image
                            src={story.image}
                            alt={story.title}
                            fill
                            sizes="100px"
                            className="object-cover transition duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e0f7fa] to-[#b2ebf2]">
                            <Camera className="size-8 text-teal/40" />
                          </div>
                        )}
                      </div>

                      {/* Text right */}
                      <div className="flex-1">
                        <p className="font-comic text-teal text-xs font-bold uppercase">{story.category || "AUTISM CARE"}</p>
                        <h3 className="font-marissa mt-1 text-[#1a1a2e] transition-colors group-hover:text-teal" style={{ fontSize: 18, lineHeight: 1.3 }}>
                          {story.title}
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-dm text-xs text-gray-500">{story.formattedDate}</span>
                          <span className="font-comic text-teal text-xs font-bold">READ ↗</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <div className="rounded-2xl bg-gray-50 p-12 text-center">
              <p className="font-comic text-teal text-xs font-bold uppercase tracking-widest">No stories yet</p>
              <h3 className="font-marissa mt-3 text-2xl text-[#1a1a2e]">This section is ready for the next published story.</h3>
            </div>
          )}

          {/* BOTTOM TWO CARDS (equal 2-column) */}
          {remainingStories.length > 0 && (
            <motion.div
              variants={cardContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="mt-6 grid gap-6 md:grid-cols-2"
            >
              {remainingStories.slice(0, 2).map((story) => (
                <motion.div key={story.id} variants={cardVariants}>
                  <Link href={`/stories/${story.slug}`} className="group">
                    <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      {/* Image */}
                      <div className="relative aspect-[3/2] overflow-hidden">
                        {story.image ? (
                          <Image
                            src={story.image}
                            alt={story.title}
                            fill
                            sizes="(min-width: 768px) 45vw, 100vw"
                            className="object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e0f7fa] to-[#b2ebf2]">
                            <Camera className="size-12 text-teal/40" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <span className="font-comic inline-block rounded-full bg-teal px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                          {story.category || "AUTISM CARE"}
                        </span>
                        <h3 className="font-marissa mt-3 text-[#1a1a2e] transition-colors group-hover:text-teal" style={{ fontSize: 22, lineHeight: 1.3 }}>
                          {story.title}
                        </h3>
                        <p className="font-dm mt-2 text-muted-foreground line-clamp-2 text-sm">
                          {story.excerpt}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-dm text-xs text-gray-500">{story.formattedDate}</span>
                          <span className="font-comic text-teal text-sm font-bold">Read story →</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Additional stories if more than 2 */}
          {remainingStories.length > 2 && (
            <motion.div
              variants={cardContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {remainingStories.slice(2).map((story) => (
                <motion.div key={story.id} variants={cardVariants}>
                  <Link href={`/stories/${story.slug}`} className="group">
                    <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      {/* Image */}
                      <div className="relative aspect-[3/2] overflow-hidden">
                        {story.image ? (
                          <Image
                            src={story.image}
                            alt={story.title}
                            fill
                            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                            className="object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e0f7fa] to-[#b2ebf2]">
                            <Camera className="size-12 text-teal/40" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <span className="font-comic inline-block rounded-full bg-teal px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                          {story.category || "AUTISM CARE"}
                        </span>
                        <h3 className="font-marissa mt-3 text-[#1a1a2e] transition-colors group-hover:text-teal" style={{ fontSize: 20, lineHeight: 1.3 }}>
                          {story.title}
                        </h3>
                        <p className="font-dm mt-2 text-muted-foreground line-clamp-2 text-sm">
                          {story.excerpt}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-dm text-xs text-gray-500">{story.formattedDate}</span>
                          <span className="font-comic text-teal text-sm font-bold">Read story →</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </>
  )
}

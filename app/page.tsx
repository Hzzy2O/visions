"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import ContentCard from "@/components/content-card"
import ContentFilter, { type FilterType, type SortType } from "@/components/content-filter"
import { contents } from "@/data/mock-data"
import { motion, AnimatePresence } from "framer-motion"

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [activeSort, setActiveSort] = useState<SortType>("latest")
  const [filteredContents, setFilteredContents] = useState(contents)
  const [imagesVisible, setImagesVisible] = useState(false)
  const [articlesVisible, setArticlesVisible] = useState(false)

  const contentSectionRef = useRef<HTMLDivElement>(null)

  // Apply filters and sorting
  useEffect(() => {
    let result = [...contents]

    // Apply type filter
    if (activeFilter !== "all") {
      result = result.filter((content) => content.type === activeFilter)
    }

    // Apply sorting
    switch (activeSort) {
      case "latest":
        result = result.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
        break
      case "oldest":
        result = result.sort((a, b) => new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime())
        break
      case "popular":
        result = result.sort((a, b) => (b.likes || 0) - (a.likes || 0))
        break
    }

    setFilteredContents(result)
  }, [activeFilter, activeSort])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === contentSectionRef.current && entry.isIntersecting) {
            setImagesVisible(true)
            setArticlesVisible(true)
          }
        })
      },
      { threshold: 0.1 },
    )

    if (contentSectionRef.current) observer.observe(contentSectionRef.current)

    return () => {
      if (contentSectionRef.current) observer.unobserve(contentSectionRef.current)
    }
  }, [])

  return (
    <div className="container py-8 md:py-12">
      {/* Hero Section */}
      <section className="mb-16 rounded-3xl bg-lime p-8 md:p-12 overflow-hidden">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="animate-fade-in">
            <h1 className="hero-title">SHARE YOUR VISIONS</h1>
            <p className="mt-4 text-xl">
              Showcase your creative work on this platform, connecting with creators and enthusiasts worldwide
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="rounded-full bg-white px-4 py-2 font-medium">149K+ Published Works</div>
              <div className="rounded-full bg-white px-4 py-2 font-medium">100+ Monthly Featured Creators</div>
            </div>
          </div>
          <div className="relative h-64 md:h-80 animate-fade-in-delayed">
            <div className="absolute -bottom-4 -right-4 h-full w-3/4 rounded-3xl bg-blue"></div>
            <div className="absolute -left-4 -top-4 h-full w-3/4 rounded-3xl bg-white"></div>
            <Image
              src="/placeholder.svg?key=bkhoc"
              alt="Creative Digital Art"
              fill
              className="rounded-3xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Content Section with Filters */}
      <section className="mb-16" ref={contentSectionRef}>
        <h2 className="section-title mb-8 inline-block">Explore Content</h2>

        <ContentFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          activeSort={activeSort}
          onSortChange={setActiveSort}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter + activeSort}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredContents.length > 0 ? (
              filteredContents.map((content, index) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ContentCard content={content} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-lg text-muted-foreground">No content found matching your filters.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  )
}

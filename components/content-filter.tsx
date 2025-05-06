"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import FilterButton from "./filter-button"
import { ChevronDown, Search } from "lucide-react"

export type FilterType = "all" | "image" | "article"
export type SortType = "latest" | "popular" | "oldest"

type ContentFilterProps = {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  activeSort?: SortType
  onSortChange?: (sort: SortType) => void
  showSortOptions?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export default function ContentFilter({
  activeFilter,
  onFilterChange,
  activeSort = "latest",
  onSortChange,
  showSortOptions = true,
  searchQuery = "",
  onSearchChange,
}: ContentFilterProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const sortOptions: { value: SortType; label: string }[] = [
    { value: "latest", label: "Latest" },
    { value: "popular", label: "Most Popular" },
    { value: "oldest", label: "Oldest" },
  ]

  const handleSortChange = (sort: SortType) => {
    if (onSortChange) {
      onSortChange(sort)
    }
    setShowSortDropdown(false)
  }

  return (
    <div className="mb-8 flex flex-col gap-4 border-b sm:gap-6">
      {/* Search Bar */}
      {onSearchChange && (
        <div className="relative w-full">
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-white px-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Clear search</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row w-full">
        <div className="flex space-x-2">
        <FilterButton active={activeFilter === "all"} onClick={() => onFilterChange("all")}>
          All Content
        </FilterButton>
        <FilterButton active={activeFilter === "image"} onClick={() => onFilterChange("image")}>
          Images
        </FilterButton>
        <FilterButton active={activeFilter === "article"} onClick={() => onFilterChange("article")}>
          Articles
        </FilterButton>
      </div>

      {showSortOptions && (
        <div className="relative mb-2 sm:mb-0">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Sort by:{" "}
            <span className="font-medium text-foreground">
              {sortOptions.find((o) => o.value === activeSort)?.label}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${showSortDropdown ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showSortDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border bg-white p-1 shadow-md"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                      activeSort === option.value ? "bg-muted font-medium text-blue" : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      </div>
    </div>
  )
}

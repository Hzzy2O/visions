"use client"

import type { ReactNode } from "react"

type FilterButtonProps = {
  active: boolean
  onClick: () => void
  children: ReactNode
}

export default function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${
        active ? "text-blue" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      <span
        className={`absolute bottom-0 left-0 h-0.5 w-full transform bg-blue transition-transform duration-300 ${
          active ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </button>
  )
}

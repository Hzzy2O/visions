"use client"

import { X } from "lucide-react"

type FilterChipProps = {
  label: string
  onRemove: () => void
  active?: boolean
}

export default function FilterChip({ label, onRemove, active = true }: FilterChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
        active ? "bg-blue/10 text-blue" : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
      <button
        onClick={(e) => {
          e.preventDefault()
          onRemove()
        }}
        className="ml-1 rounded-full p-0.5 hover:bg-blue/20"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

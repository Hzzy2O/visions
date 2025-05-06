
"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ContentCardSkeleton() {
  return (
    <div className="content-card h-full flex flex-col border border-border rounded-lg overflow-hidden">
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: "240px" }}>
        <Skeleton className="h-full w-full" />
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

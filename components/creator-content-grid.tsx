
"use client"

import { Suspense, lazy } from "react"
import dynamic from "next/dynamic"
import ContentCardSkeleton from "@/components/content-card-skeleton"
import type { Content } from "@/types/content"

// Dynamically import the ContentCard component
const ContentCard = dynamic(() => import("@/components/content-card"), {
  loading: () => <ContentCardSkeleton />,
  ssr: false
})

type CreatorContentGridProps = {
  contents: Content[]
  emptyMessage?: string
}

export default function CreatorContentGrid({
  contents,
  emptyMessage = "No content available.",
}: CreatorContentGridProps) {
  if (contents.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {contents.map((content) => (
        <Suspense key={content.id} fallback={<ContentCardSkeleton />}>
          <ContentCard content={content} />
        </Suspense>
      ))}
    </div>
  )
}

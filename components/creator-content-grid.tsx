import ContentCard from "@/components/content-card"
import type { Content } from "@/types/content"

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
        <ContentCard key={content.id} content={content} />
      ))}
    </div>
  )
}

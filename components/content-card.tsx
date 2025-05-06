"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Lock, FileText, ImageIcon } from "lucide-react"
import type { Content } from "@/types/content"

type ContentCardProps = {
  content: Content
}

export default function ContentCard({ content }: ContentCardProps) {
  const { id, type, title, creator, thumbnail, locked = false } = content
  const cardRef = useRef<HTMLDivElement>(null)

  const getTypeIcon = () => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Link href={`/content/${id}`} className="block h-full">
      <div
        ref={cardRef}
        className="content-card group h-full flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue/10 dark:hover:shadow-blue/5 border border-border rounded-lg overflow-hidden"
      >
        <div className={`relative overflow-hidden ${locked ? "content-card-locked" : ""} flex-shrink-0`} style={{ height: "240px" }}>
          {type === "article" ? (
            <div className="relative h-full w-full bg-gradient-to-br from-blue/10 to-blue/5 p-6">
              <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="capitalize">{type}</span>
                </div>
              </div>

              <div className="flex h-full flex-col">
                <h3 className="text-xl font-bold line-clamp-2">{title}</h3>

                {content.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{content.description}</p>
                )}

                <div className="mt-auto flex items-center gap-2">
                  {content.readTime && <span className="text-xs text-muted-foreground">{content.readTime} read</span>}
                </div>
              </div>
            </div>
          ) : (
            <>
              <Image
                src={thumbnail || "/placeholder.svg"}
                alt={title}
                fill
                className="content-card-image object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                <div className="flex items-center gap-1">
                  {getTypeIcon()}
                  <span className="capitalize">{type}</span>
                </div>
              </div>
              {locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <Lock className="h-12 w-12 text-white" />
                </div>
              )}
            </>
          )}
        </div>
        <div className="content-card-content p-4 flex-grow flex flex-col">
          {type !== "article" && <h3 className="line-clamp-1 text-lg font-bold">{title}</h3>}
          <div className="mt-auto flex items-center gap-2 pt-2">
            <Image
              src={creator.avatar || "/placeholder.svg"}
              alt={creator.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-sm text-muted-foreground">{creator.name}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

"use client"

import Image from "next/image"
import Link from "next/link"
import { Lock, FileText, ImageIcon } from "lucide-react"
import type { Content } from "@/types/content"

type ContentCardProps = Content

export default function ContentCard(props: ContentCardProps) {
  const {
    id,
    type,
    title,
    creatorId,
    walrusReference,
    previewReference,
    locked = false,
    description
  } = props

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
                {description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{description}</p>
                )}
              </div>
            </div>
          ) : (
            <Image
              src={previewReference ? `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${previewReference}` : (walrusReference ? `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${walrusReference}` : "/placeholder.svg")}
              alt={title}
              fill
              className="content-card-image object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
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
        </div>
        <div className="content-card-content p-4 flex-grow flex flex-col">
          {type !== "article" && <h3 className="line-clamp-1 text-lg font-bold">{title}</h3>}
          <div className="mt-auto flex items-center gap-2 pt-2">
            <span className="font-mono text-xs text-gray-500 dark:text-gray-300 select-all" title={creatorId}>
              {description}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

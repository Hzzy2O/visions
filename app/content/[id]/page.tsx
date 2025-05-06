"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Heart, Share2, MessageSquare, FileText, ImageIcon } from "lucide-react"
import { useWallet } from "@/context/wallet-context"
import { contents } from "@/data/mock-data"
import type { Content } from "@/types/content"
import ReactMarkdown from "react-markdown"

export default function ContentPage({ params }: { params: { id: string } }) {
  const { connected } = useWallet()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [content, setContent] = useState<Content | null>(null)

  useEffect(() => {
    // Simulate fetching content from API
    const foundContent = contents.find((c) => c.id === params.id) || null
    setContent(foundContent)
  }, [params.id])

  const handleSubscribe = () => {
    if (!connected) {
      alert("Please connect your wallet first")
      return
    }
    setIsSubscribed(true)
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  if (!content) {
    return (
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="skeleton h-16 w-16 rounded-full"></div>
            <div>
              <div className="skeleton h-6 w-48 mb-2"></div>
              <div className="skeleton h-4 w-24"></div>
            </div>
          </div>
          <div className="skeleton h-8 w-64 mb-2"></div>
          <div className="skeleton h-4 w-full max-w-2xl mb-2"></div>
          <div className="skeleton h-4 w-full max-w-xl"></div>
        </div>
        
        <div className="mt-8">
          <div className="skeleton h-[400px] w-full rounded-lg mb-8"></div>
          <div className="space-y-4">
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  const renderContentByType = () => {
    if (!isSubscribed && content.locked) {
      return (
        <div className="relative aspect-square overflow-hidden rounded-2xl">
          <Image
            src={content.thumbnail || "/placeholder.svg"}
            alt={content.title}
            fill
            className="object-cover blur-sm"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <Lock className="h-16 w-16 text-white" />
            <p className="mt-4 text-center text-xl font-bold text-white">Subscribe to view full content</p>
            <Button className="mt-6 bg-blue text-white hover:bg-blue/90" onClick={handleSubscribe}>
              Subscribe {content.price}
            </Button>
          </div>
        </div>
      )
    }

    switch (content.type) {
      case "image":
        return (
          <div className="relative aspect-square overflow-hidden rounded-2xl">
            <Image
              src={content.fullImage || content.thumbnail || "/placeholder.svg"}
              alt={content.title}
              fill
              className="object-cover"
            />
          </div>
        )
      case "article":
        return (
          <div className="prose prose-lg max-w-none rounded-2xl border bg-white p-6 shadow-sm">
            <ReactMarkdown>{content.articleContent || "Article content not available"}</ReactMarkdown>
          </div>
        )
      default:
        return <p>Unsupported content type</p>
    }
  }

  const getTypeIcon = () => {
    switch (content.type) {
      case "article":
        return <FileText className="h-5 w-5" />
      case "image":
        return <ImageIcon className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Content Display */}
        <div>{renderContentByType()}</div>

        {/* Content Info */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            {getTypeIcon()}
            <span className="rounded-full bg-muted px-3 py-1 text-sm capitalize">{content.type}</span>
            {content.readTime && (
              <span className="text-sm text-muted-foreground">Reading time: {content.readTime}</span>
            )}
          </div>

          <h1 className="text-3xl font-bold">{content.title}</h1>

          <div className="mt-4 flex items-center gap-4">
            <Image
              src={content.creator.avatar || "/placeholder.svg"}
              alt={content.creator.name}
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <h3 className="font-bold">{content.creator.name}</h3>
              <p className="text-sm text-muted-foreground">{content.creator.bio}</p>
            </div>
          </div>

          <p className="mt-6">{content.description}</p>

          {isSubscribed && content.locked && (
            <div className="mt-6 rounded-xl bg-lime p-4">
              <div className="flex items-center gap-2">
                <Unlock className="h-5 w-5" />
                <span className="font-medium">You've subscribed to this content</span>
              </div>
              <p className="mt-2 text-sm">
                Thank you for your support! You can now view the full content and receive exclusive updates from the
                creator.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full ${isLiked ? "bg-red-100 text-red-500" : ""}`}
              onClick={handleLike}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500" : ""}`} />
            </Button>
            <span>{isLiked ? (content.likes || 0) + 1 : content.likes}</span>

            <Button variant="outline" size="icon" className="rounded-full">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <span>{content.comments}</span>

            <Button variant="outline" size="icon" className="rounded-full">
              <Share2 className="h-5 w-5" />
            </Button>
            <span>{content.shares}</span>
          </div>

          {content.locked && !isSubscribed && (
            <Button className="mt-8 w-full bg-blue text-white hover:bg-blue/90" onClick={handleSubscribe}>
              Subscribe to Content {content.price}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

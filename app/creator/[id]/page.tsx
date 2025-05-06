"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import CreatorContentGrid from "@/components/creator-content-grid"
import { contents, mySubscriptions } from "@/data/mock-data"
import type { Content, Creator } from "@/types/content"

export default function CreatorPage({ params }: { params: { id: string } }) {
  const [creator, setCreator] = useState<Creator | null>(null)
  const [creatorContents, setCreatorContents] = useState<Content[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "images" | "articles">("all")

  useEffect(() => {
    // Simulate fetching creator data
    const fetchCreator = () => {
      setIsLoading(true)

      // Find the creator from subscriptions
      const foundCreator = mySubscriptions.find((sub) => sub.id === params.id)

      if (foundCreator) {
        setCreator({
          id: foundCreator.id,
          name: foundCreator.name,
          avatar: foundCreator.avatar,
          bio: foundCreator.bio,
        })

        // Filter contents by this creator
        // In a real app, you would fetch this from an API
        const creatorContent = contents.filter((content) => content.creator.name === foundCreator.name)

        setCreatorContents(creatorContent)
      }

      setIsLoading(false)
    }

    fetchCreator()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container flex h-[60vh] items-center justify-center py-8 md:py-12">
        <p className="text-xl">Loading creator profile...</p>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="container flex h-[60vh] items-center justify-center py-8 md:py-12">
        <p className="text-xl">Creator not found</p>
      </div>
    )
  }

  // Filter content based on active tab
  const filteredContents =
    activeTab === "all"
      ? creatorContents
      : creatorContents.filter((content) => content.type === (activeTab === "images" ? "image" : "article"))

  return (
    <div className="container py-8 md:py-12">
      {/* Creator Profile Header */}
      <div className="mb-12 rounded-xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <Image
            src={creator.avatar || "/placeholder.svg"}
            alt={creator.name}
            width={120}
            height={120}
            className="rounded-full"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold">{creator.name}</h1>
            <p className="mt-2 text-muted-foreground">{creator.bio}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="rounded-full bg-muted px-4 py-2 text-sm">{creatorContents.length} Published Contents</div>
              <div className="rounded-full bg-muted px-4 py-2 text-sm">
                {creatorContents.reduce((sum, content) => sum + (content.likes || 0), 0)} Total Likes
              </div>
            </div>
          </div>
          <Button className="bg-blue text-white hover:bg-blue/90">Subscribe</Button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="mb-8 flex border-b">
        <button className={`px-4 py-2 ${activeTab === "all" ? "tab-active" : ""}`} onClick={() => setActiveTab("all")}>
          All Content
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "images" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("images")}
        >
          Images
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "articles" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("articles")}
        >
          Articles
        </button>
      </div>

      {/* Creator's Content */}
      <div>
        <h2 className="section-title mb-8">
          {creator.name}'s {activeTab !== "all" ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : "Content"}
        </h2>

        <CreatorContentGrid
          contents={filteredContents}
          emptyMessage={`No ${activeTab !== "all" ? activeTab : "content"} available from this creator yet.`}
        />
      </div>
    </div>
  )
}

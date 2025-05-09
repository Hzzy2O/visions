"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, PenSquare } from "lucide-react"
import ContentCard from "@/components/content-card"
import { myContents, mySubscriptions } from "@/data/mock-data"
import { useProfile } from "@/context/profile-context"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"published" | "subscriptions">("published")
  const { profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="container flex h-[60vh] items-center justify-center py-8 md:py-12">
        <p className="text-xl">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Profile Header with Cover */}
      <div className="relative mb-20">
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden rounded-xl">
          <Image src={profile.coverImage || "/placeholder.svg?key=cover"} alt="Cover" fill className="object-cover" />
          {profile.isCreator && (
            <div className="absolute top-4 right-4 rounded-full bg-blue px-3 py-1 text-sm font-medium text-white">
              Creator
            </div>
          )}
        </div>

        {/* Profile Info and Avatar */}
        <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 text-center">
          <Image
            src={profile.avatar || "/placeholder.svg"}
            alt="Profile"
            width={128}
            height={128}
            className="mx-auto rounded-full border-4 border-white"
          />
          <h1 className="mt-4 text-2xl font-bold">{profile.name}</h1>
          <p className="mt-2 max-w-md text-muted-foreground">{profile.bio}</p>

          {/* Social Links */}
          {profile.social && Object.values(profile.social).some((link) => link) && (
            <div className="mt-2 flex justify-center gap-4">
              {profile.social.twitter && (
                <a
                  href={`https://twitter.com/${profile.social.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-blue"
                >
                  Twitter
                </a>
              )}
              {profile.social.instagram && (
                <a
                  href={`https://instagram.com/${profile.social.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-blue"
                >
                  Instagram
                </a>
              )}
              {profile.social.discord && (
                <a
                  href={`https://discord.com/${profile.social.discord}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-blue"
                >
                  Discord
                </a>
              )}
            </div>
          )}

          {/* Edit Profile Button */}
          <Link href="/profile/edit">
            <Button className="mt-4 bg-blue text-white hover:bg-blue/90">
              <PenSquare className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex justify-center border-b">
        <button
          className={`px-4 py-2 ${activeTab === "published" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("published")}
        >
          My Publications
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "subscriptions" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("subscriptions")}
        >
          My Subscriptions
        </button>
      </div>

      {/* Content */}
      {activeTab === "published" ? (
        <div>
          <div className="mb-6 flex justify-between">
            <h2 className="text-2xl font-bold">My Published Content</h2>
            <Link href="/publish">
              <Button className="bg-blue text-white hover:bg-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                Publish New Content
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myContents.map((content) => (
              <div key={content.id} className="group relative">
                <ContentCard content={content} />
                <div className="absolute right-2 top-2 hidden gap-2 group-hover:flex">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="mb-6 text-2xl font-bold">My Subscriptions</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mySubscriptions.map((creator) => (
              <div key={creator.id} className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <Image
                    src={creator.avatar || "/placeholder.svg"}
                    alt={creator.name}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-bold">{creator.name}</h3>
                    <p className="text-sm text-muted-foreground">{creator.contentCount} contents</p>
                  </div>
                </div>
                <p className="mt-4 text-sm">{creator.bio}</p>
                <Link href={`/creator/${creator.id}`}>
                  <Button className="mt-4 w-full bg-blue text-white hover:bg-blue/90">View Content</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

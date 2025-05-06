"use client"

import type React from "react"

import { useState, useRef, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useProfile } from "@/context/profile-context"
import { X, Camera, LinkIcon, Twitter, Instagram, User } from "lucide-react"

export default function EditProfilePage() {
  const router = useRouter()
  const { profile, updateProfile } = useProfile()

  const [formData, setFormData] = useState({
    name: profile.name,
    bio: profile.bio,
    website: profile.website || "",
    twitter: profile.social?.twitter || "",
    instagram: profile.social?.instagram || "",
    discord: profile.social?.discord || "",
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCoverPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Create the updated profile object
    const updatedProfile = {
      name: formData.name,
      bio: formData.bio,
      website: formData.website || undefined,
      social: {
        twitter: formData.twitter || undefined,
        instagram: formData.instagram || undefined,
        discord: formData.discord || undefined,
      },
    }

    // If we have new images, add them to the update
    if (avatarPreview) {
      updatedProfile.avatar = avatarPreview
    }

    if (coverPreview) {
      updatedProfile.coverImage = coverPreview
    }

    // Update the profile
    updateProfile(updatedProfile)

    // Simulate API call delay
    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/profile")
    }, 1000)
  }

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <h1 className="mb-8 text-3xl font-bold">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden rounded-xl bg-muted">
          {(coverPreview || profile.coverImage) && (
            <Image
              src={coverPreview || profile.coverImage || "/placeholder.svg"}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="rounded-full bg-white"
              onClick={() => coverInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
            {coverPreview && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="rounded-full"
                onClick={() => setCoverPreview(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
        </div>

        {/* Avatar */}
        <div className="relative mx-auto -mt-16 h-32 w-32">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white">
            <Image src={avatarPreview || profile.avatar} alt="Avatar" fill className="object-cover" />
          </div>
          <div className="absolute bottom-0 right-0">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="rounded-full bg-white shadow-md"
              onClick={() => avatarInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </div>
        </div>

        <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="flex items-center rounded-md border bg-background px-3">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="border-0 bg-transparent"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell others about yourself..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="flex items-center rounded-md border bg-background px-3">
                <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                  className="border-0 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Social Links</h2>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <div className="flex items-center rounded-md border bg-background px-3">
                <Twitter className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  placeholder="username"
                  className="border-0 bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="flex items-center rounded-md border bg-background px-3">
                <Instagram className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  placeholder="username"
                  className="border-0 bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue text-white hover:bg-blue/90" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}

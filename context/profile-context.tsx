"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

// Define the user profile type
export interface UserProfile {
  name: string
  avatar: string
  bio: string
  coverImage?: string
  website?: string
  isCreator?: boolean
  subscriptionPrice?: number
  social?: {
    twitter?: string
    instagram?: string
    discord?: string
  }
}

// Default profile data
const defaultProfile: UserProfile = {
  name: "Web3 Content Creator",
  avatar: "/abstract-profile.png",
  bio: "Digital creator passionate about Web3 technology and visual storytelling.",
  coverImage: "/placeholder.svg?key=cover-image",
  isCreator: false,
  social: {
    twitter: "creator",
    instagram: "creator",
  },
}

interface ProfileContextType {
  profile: UserProfile
  updateProfile: (updatedProfile: Partial<UserProfile>) => void
  isLoading: boolean
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real app, we would fetch the profile from an API
    // For now, we're just simulating a loading state
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const updateProfile = (updatedProfile: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updatedProfile }))
    // In a real app, we would send this update to an API
  }

  return <ProfileContext.Provider value={{ profile, updateProfile, isLoading }}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}

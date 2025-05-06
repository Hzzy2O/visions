export type ContentType = "image" | "article"

export interface Creator {
  id: string
  name: string
  avatar: string
  bio?: string
}

export interface Content {
  id: string
  type: ContentType
  title: string
  description?: string
  creator: Creator
  thumbnail: string
  locked?: boolean
  price?: string
  likes?: number
  comments?: number
  shares?: number
  createdAt?: string
  // Image content specific
  fullImage?: string
  // Article content specific
  articleContent?: string
  readTime?: string
}

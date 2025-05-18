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
  creatorId: string
  createdAt: string
  walrusReference: string
  previewReference?: string
  thumbnail?: string
  locked?: boolean
  price?: string
  likes?: number
  comments?: number
  shares?: number
  // Image content specific
  fullImage?: string
  // Article content specific
  articleContent?: string
  readTime?: string
}

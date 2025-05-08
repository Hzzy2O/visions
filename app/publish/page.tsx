"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, FileText, ImageIcon } from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import type { ContentType } from "@/types/content";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function PublishPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const [contentType, setContentType] = useState<ContentType>("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handlePublish = () => {
    if (!account?.address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!title || !description || !price) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate required fields based on content type
    if (contentType === "image" && !selectedImage) {
      alert("Please upload an image");
      return;
    } else if (contentType === "article" && !articleContent) {
      alert("Please enter article content");
      return;
    }

    setIsPublishing(true);

    // Simulate publishing process
    setTimeout(() => {
      setIsPublishing(false);
      router.push("/profile");
    }, 2000);
  };

  const renderContentTypeFields = () => {
    switch (contentType) {
      case "image":
        return (
          <div className="space-y-2">
            <Label>Upload Image</Label>
            {selectedImage ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={selectedImage || "/placeholder.svg"}
                  alt="Selected image"
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12">
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  Drag and drop image or click to upload
                </p>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                  className="mt-2"
                >
                  Select Image
                </Button>
              </div>
            )}
          </div>
        );
      case "article":
        return (
          <div className="space-y-2">
            <Label htmlFor="article-content">Article Content</Label>
            <Textarea
              id="article-content"
              placeholder="Write your article content using Markdown format..."
              rows={10}
              value={articleContent}
              onChange={(e) => setArticleContent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Markdown format supported
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <h1 className="mb-8 text-3xl font-bold">Publish New Content</h1>

      <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
        {/* Content Type Selection */}
        <div className="space-y-2">
          <Label>Content Type</Label>
          <RadioGroup
            value={contentType}
            onValueChange={(value) => setContentType(value as ContentType)}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="image" />
              <Label
                htmlFor="image"
                className="flex items-center gap-1 font-normal"
              >
                <ImageIcon className="h-4 w-4" />
                Image
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="article" id="article" />
              <Label
                htmlFor="article"
                className="flex items-center gap-1 font-normal"
              >
                <FileText className="h-4 w-4" />
                Article
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter content title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your content..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Subscription Price (SUI)</Label>
          <Input
            id="price"
            type="number"
            placeholder="0.05"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {/* Render fields based on content type */}
        {renderContentTypeFields()}

        {/* Publish Button */}
        <Button
          className="w-full bg-blue text-white hover:bg-blue/90"
          onClick={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? "Publishing..." : "Publish Content"}
        </Button>
      </div>
    </div>
  );
}

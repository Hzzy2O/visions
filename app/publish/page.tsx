"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, FileText, ImageIcon, Loader } from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import type { ContentType } from "@/types/content";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";

export default function PublishPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const [contentType, setContentType] = useState<ContentType>("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [articleContent, setArticleContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedBlobId, setUploadedBlobId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>("service1");
  
  // Configuration for Walrus upload
  const NUM_EPOCH = 1;
  const packageId = "0x1"; // Replace with your actual package ID
  const policyObject = ""; // Replace with your policy object
  const cap_id = ""; // Replace with your cap ID
  const moduleName = "content_module"; // Replace with your module name
  
  const suiClient = useSuiClient();
  const SUI_VIEW_TX_URL = `https://suiscan.xyz/testnet/tx`;
  const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`;
  
  const client = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
  });
  
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const services = [
    {
      id: "service1",
      name: "walrus.space",
      publisherUrl: "/publisher1",
      aggregatorUrl: "/aggregator1",
    },
    {
      id: "service2",
      name: "staketab.org",
      publisherUrl: "/publisher2",
      aggregatorUrl: "/aggregator2",
    },
    {
      id: "service3",
      name: "redundex.com",
      publisherUrl: "/publisher3",
      aggregatorUrl: "/aggregator3",
    },
    {
      id: "service4",
      name: "nodes.guru",
      publisherUrl: "/publisher4",
      aggregatorUrl: "/aggregator4",
    },
    {
      id: "service5",
      name: "banansen.dev",
      publisherUrl: "/publisher5",
      aggregatorUrl: "/aggregator5",
    },
    {
      id: "service6",
      name: "everstake.one",
      publisherUrl: "/publisher6",
      aggregatorUrl: "/aggregator6",
    },
  ];

  const getAggregatorUrl = (path: string): string => {
    const service = services.find((s) => s.id === selectedService);
    const cleanPath = path.replace(/^\/+/, "").replace(/^v1\//, "");
    return `${service?.aggregatorUrl}/v1/${cleanPath}`;
  };

  const getPublisherUrl = (path: string): string => {
    const service = services.find((s) => s.id === selectedService);
    const cleanPath = path.replace(/^\/+/, "").replace(/^v1\//, "");
    return `${service?.publisherUrl}/v1/${cleanPath}`;
  };

  const storeBlob = (encryptedData: Uint8Array) => {
    return fetch(`${getPublisherUrl(`/v1/blobs?epochs=${NUM_EPOCH}`)}`, {
      method: "PUT",
      body: encryptedData,
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((info) => {
          return { info };
        });
      } else {
        alert(
          "Error publishing the blob on Walrus, please select a different Walrus service."
        );
        setIsUploading(false);
        throw new Error("Something went wrong when storing the blob!");
      }
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 10 MiB size
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10 MiB");
        return;
      }
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed");
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    setUploadedBlobId(null);
  };
  
  const uploadToWalrus = async () => {
    if (!imageFile) return;
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async function(event) {
        if (event.target && event.target.result) {
          const result = event.target.result;
          if (result instanceof ArrayBuffer) {
            const nonce = crypto.getRandomValues(new Uint8Array(5));
            const policyObjectBytes = fromHex(policyObject || "0x1"); // Fallback if not set
            const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
            
            const { encryptedObject: encryptedBytes } = await client.encrypt({
              threshold: 2,
              packageId,
              id,
              data: new Uint8Array(result),
            });
            
            const storageInfo = await storeBlob(encryptedBytes);
            console.log("Storage info:", storageInfo);
            
            // Extract blobId
            let blobId = "";
            if ("alreadyCertified" in storageInfo.info) {
              blobId = storageInfo.info.alreadyCertified.blobId;
            } else if ("newlyCreated" in storageInfo.info) {
              blobId = storageInfo.info.newlyCreated.blobObject.blobId;
            }
            
            setUploadedBlobId(blobId);
            setIsUploading(false);
          } else {
            console.error("Unexpected result type:", typeof result);
            setIsUploading(false);
          }
        }
      };
      
      reader.readAsArrayBuffer(imageFile);
    } catch (error) {
      console.error("Error uploading to Walrus:", error);
      setIsUploading(false);
    }
  };
  
  const associateToSuiObject = async () => {
    if (!uploadedBlobId) return;
    
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${moduleName}::publish`,
      arguments: [
        tx.object(policyObject),
        tx.object(cap_id),
        tx.pure.string(uploadedBlobId),
      ],
    });

    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log("Transaction result:", result);
          alert("Content published successfully!");
        },
        onError: (error) => {
          console.error("Transaction error:", error);
          alert("Failed to publish content. Please try again.");
        }
      },
    );
  };

  const handlePublish = async () => {
    if (!account?.address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!title || !description || !price) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate required fields based on content type
    if (contentType === "image") {
      if (!selectedImage) {
        alert("Please upload an image");
        return;
      }
      
      if (!uploadedBlobId) {
        // Need to upload to Walrus first
        await uploadToWalrus();
        return;
      }
      
      // Now associate the uploaded blob with a Sui object
      try {
        setIsPublishing(true);
        await associateToSuiObject();
        setIsPublishing(false);
        router.push("/profile");
      } catch (error) {
        console.error("Error publishing:", error);
        setIsPublishing(false);
        alert("Failed to publish. Please try again.");
      }
    } else if (contentType === "article") {
      if (!articleContent) {
        alert("Please enter article content");
        return;
      }
      
      // For non-image content, use the original flow for now
      setIsPublishing(true);
      setTimeout(() => {
        setIsPublishing(false);
        router.push("/profile");
      }, 2000);
    }
  };

  const renderContentTypeFields = () => {
    switch (contentType) {
      case "image":
        return (
          <div className="space-y-4">
            <Label>Upload Image</Label>
            
            <div className="flex flex-col space-y-2 mb-4">
              <Label>Select Walrus service:</Label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full rounded-md border border-input p-2"
                aria-label="Select Walrus service"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedImage ? (
              <div className="space-y-4">
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
                
                {!uploadedBlobId && (
                  <Button 
                    onClick={uploadToWalrus} 
                    disabled={isUploading || !imageFile} 
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Encrypting & Uploading...
                      </>
                    ) : (
                      "Encrypt & Upload to Walrus"
                    )}
                  </Button>
                )}
                
                {uploadedBlobId && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-md">
                    ✓ Uploaded successfully! Blob ID: {uploadedBlobId.substring(0, 8)}...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12">
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  Drag and drop image or click to upload
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  File size must be less than 10 MiB. Only image files are allowed.
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
          disabled={isPublishing || (contentType === "image" && !uploadedBlobId && selectedImage)}
        >
          {isPublishing ? "Publishing..." : (
            contentType === "image" && selectedImage && !uploadedBlobId 
              ? "Upload to Walrus First" 
              : "Publish Content"
          )}
        </Button>
      </div>
    </div>
  );
}

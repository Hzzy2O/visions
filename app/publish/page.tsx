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
import type { ContentType } from "@/types/content";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { network, networkConfig, suiClient } from '@/contracts';
import { useTransactionNotifier } from "@/components/ui/TransactionNotifier";

const packageId = networkConfig[network].variables.package;

const DEFAULT_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space/v1";
const DEFAULT_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space/v1";

export default function PublishPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { showTxStatus } = useTransactionNotifier();


  const [contentType, setContentType] = useState<ContentType>("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [articleContent, setArticleContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadedBlobId, setUploadedBlobId] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewBlobId, setPreviewBlobId] = useState<string | null>(null);
  
  // Configuration for Walrus upload
  const NUM_EPOCH = 1;
  const policyObject = ""; // Replace with your policy object
  const cap_id = ""; // Replace with your cap ID
  
  const suiClient = useSuiClient();
  
  const client = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers(network),
    verifyKeyServers: false,
  });
  
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const storeBlob = async (encryptedData: Uint8Array) => {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encryptedData: Array.from(encryptedData),
        numEpochs: NUM_EPOCH,
        send_object_to: account?.address || "",
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert("Error publishing the blob on Walrus: " + err.error);
      throw new Error(err.error);
    }
    return res.json();
  };

  // 优化后的预览图生成函数，边缘模糊更自然
  const generateBlurredPreview = async (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = function () {
        const width = 320;
        const height = 180;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        if (!ctx) return reject('No canvas context');
        ctx.filter = 'blur(15px)';
        const scale = 1.1;
        const sw = img.width * scale;
        const sh = img.height * scale;
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        ctx.drawImage(
          img,
          sx, sy, sw, sh, // 源图像区域
          0, 0, width, height // 目标canvas区域
        );
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = reject;
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10 MiB");
        return;
      }
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
      try {
        const previewBase64 = await generateBlurredPreview(file);
        setPreviewImage(previewBase64);
        setPreviewBlobId(null);
      } catch (err) {
        setPreviewImage(null);
        setPreviewBlobId(null);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    setUploadedBlobId(null);
    setPreviewImage(null);
    setPreviewBlobId(null);
  };
  
  const associateToSuiObject = (blobId: string, previewBlobId: string): Promise<string> => {
    if (!blobId || !previewBlobId || !creatorId || !account?.address) {
      throw new Error("Missing required parameters");
    }
    return new Promise<string>((resolve, reject) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::content::create_premium_content`,
        arguments: [
          tx.object(creatorId),
          tx.object(account.address),
          tx.pure.string(title),
          tx.pure.string(description),
          tx.pure.string(blobId),
          tx.pure.string(previewBlobId),
          tx.pure.string(contentType),
        ],
      });
      tx.setGasBudget(10000000);
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result: any) => {
            try {
              const digest = result?.digest;
              let newObjectId = "";
              if (digest) {
                await suiClient.waitForTransaction({ digest });
                const txDetails = await suiClient.getTransactionBlock({
                  digest,
                  options: {
                    showObjectChanges: true,
                    showEvents: true,
                  },
                });
                if (Array.isArray(txDetails.objectChanges)) {
                  const createdObj: any = txDetails.objectChanges.find((c: any) => c.type === "created");
                  if (createdObj && createdObj.objectId) {
                    newObjectId = createdObj.objectId;
                  }
                }
              }
              showTxStatus("completed", "Content published successfully!", blobId);
              resolve(newObjectId);
            } catch (e) {
              console.log("e", e);
              showTxStatus("failed", "Failed to fetch transaction details.", blobId);
              resolve("");
            }
          },
          onError: (error) => {
            console.error("Transaction error:", error);
            showTxStatus("failed", "Failed to publish content. Please try again.", blobId);
            reject(error);
          }
        },
      );
    });
  };

  // base64转Blob工具
  function base64ToBlob(base64: string, mime = 'image/jpeg'): Blob {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  }

  // 预览图上传（a.html方式，Blob直传）
  const uploadPreviewImage = async (base64: string): Promise<string> => {
    const blob = base64ToBlob(base64, 'image/jpeg');
    const res = await fetch(`/api/upload?epochs=1&send_object_to=${account?.address || ''}`, {
      method: 'POST',
      body: blob,
    });
    const data = await res.json();
    if (!res.ok || !data.info) {
      throw new Error(data.error || 'Failed to upload preview image');
    }
    return data.info?.newlyCreated
      ? data.info.newlyCreated.blobObject.blobId
      : data.info.alreadyCertified.blobId;
  };

  const encryptAndUploadToWalrus = async (data: Uint8Array): Promise<string> => {
    if (!creatorId) {
      throw new Error("Cannot upload content: Creator ID not found");
    }
    
    // 查询创建者对应的服务ID
    try {
      const events = await suiClient.queryEvents({
        query: { MoveEventType: `${packageId}::subscription::ServiceCreatedEvent` },
        limit: 100,
      });
      // 找到 creator_id 匹配的 service
      const matched = events.data.find(e => (e.parsedJson as any)?.creator_id === creatorId);
      const serviceId = (matched?.parsedJson as any)?.service_id || null;
      
      if (!serviceId) {
        console.warn("未找到对应服务ID，将使用默认前缀");
      }
      
      // 使用服务ID作为前缀(如果有)，否则使用默认值
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const prefix = serviceId ? fromHex(serviceId) : fromHex("0x1");
      const id = toHex(new Uint8Array([...prefix, ...nonce]));
      
      console.log("[Debug] 加密ID:", id);
      console.log("[Debug] 使用前缀:", serviceId || "0x1");
      
      showTxStatus("submitting", "Encrypting and uploading to Walrus, please wait...", id);
      const { encryptedObject: encryptedBytes } = await client.encrypt({
        threshold: 2,
        packageId,
        id,
        data,
      });
      const storageInfo = await storeBlob(encryptedBytes);
      let blobId = "";
      if ("alreadyCertified" in storageInfo.info) {
        blobId = storageInfo.info.alreadyCertified.blobId;
      } else if ("newlyCreated" in storageInfo.info) {
        blobId = storageInfo.info.newlyCreated.blobObject.blobId;
      }
      setUploadedBlobId(blobId);
      showTxStatus("completed", "Uploaded to Walrus successfully! Blob ID: " + blobId, id);
      return blobId;
    } catch (err) {
      console.error("获取服务ID失败", err);
      // 回退到原始方法
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const policyObjectBytes = fromHex(policyObject || "0x1");
      const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
      
      showTxStatus("submitting", "Encrypting and uploading to Walrus, please wait...", id);
      const { encryptedObject: encryptedBytes } = await client.encrypt({
        threshold: 2,
        packageId,
        id,
        data,
      });
      const storageInfo = await storeBlob(encryptedBytes);
      let blobId = "";
      if ("alreadyCertified" in storageInfo.info) {
        blobId = storageInfo.info.alreadyCertified.blobId;
      } else if ("newlyCreated" in storageInfo.info) {
        blobId = storageInfo.info.newlyCreated.blobObject.blobId;
      }
      setUploadedBlobId(blobId);
      showTxStatus("completed", "Uploaded to Walrus successfully! Blob ID: " + blobId, id);
      return blobId;
    }
  };

  const handlePublish = async () => {
    if (!account?.address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!title || !description) {
      alert("Please fill in all required fields");
      return;
    }

    if (contentType === "image") {
      if (!selectedImage) {
        alert("Please upload an image");
        return;
      }
      setIsPublishing(true);
      let blobId = uploadedBlobId || "";
      let previewId = previewBlobId || "";
      try {
        // 1. 上传加密原图
        if (!uploadedBlobId) {
          blobId = await new Promise<string>((resolve, reject) => {
            if (!imageFile) return reject(new Error("No image file"));
            const reader = new FileReader();
            reader.onload = async function(event) {
              if (event.target && event.target.result && event.target.result instanceof ArrayBuffer) {
                try {
                  const arr = new Uint8Array(event.target.result);
                  const id = await encryptAndUploadToWalrus(arr);
                  resolve(id);
                } catch (err) {
                  reject(err);
                }
              } else {
                reject(new Error("File read error"));
              }
            };
            reader.readAsArrayBuffer(imageFile);
          });
          setUploadedBlobId(blobId);
        }
        // 2. 上传预览图（Blob直传）
        if (!previewBlobId && previewImage) {
          previewId = await uploadPreviewImage(previewImage);
          setPreviewBlobId(previewId);
        }
        if (!previewId) {
          throw new Error("Preview image upload failed");
        }
        showTxStatus("processing", "Publishing to Sui, associating your content on chain...", blobId);
        const objectId = await associateToSuiObject(blobId, previewId);
        setIsPublishing(false);
        if (objectId) {
          router.push(`/content/${objectId}`);
        } 
      } catch (error) {
        console.error("Error publishing:", error);
        setIsPublishing(false);
        showTxStatus("failed", "Failed to publish. Please try again. [error]", blobId);
        alert("Failed to publish. Please try again.");
      }
    } else if (contentType === "article") {
      if (!articleContent) {
        alert("Please enter article content");
        return;
      }
      setIsPublishing(true);
      let blobId = uploadedBlobId || "";
      try {
        if (!uploadedBlobId) {
          const encoder = new TextEncoder();
          const articleBytes = encoder.encode(articleContent);
          blobId = await encryptAndUploadToWalrus(articleBytes);
        }
        const objectId = await associateToSuiObject(blobId, "");
        setIsPublishing(false);
        if (objectId) {
          router.push(`/content/${objectId}`);
        } else {
          router.push("/content");
        }
      } catch (error) {
        console.error("Error publishing article:", error);
        setIsPublishing(false);
        showTxStatus("failed", "Failed to publish article. Please try again. [error]", blobId);
        alert("Failed to publish. Please try again.");
      }
    }
  };

  const renderContentTypeFields = () => {
    switch (contentType) {
      case "image":
        return (
          <div className="space-y-4">
            <Label>Upload Image</Label>
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
                {previewImage && (
                  <div className="mt-2">
                    <Label>Preview (Blurred)</Label>
                    <div className="relative aspect-video w-48 overflow-hidden rounded-lg border border-dashed border-gray-300">
                      <Image
                        src={previewImage}
                        alt="Preview image"
                        fill
                        className="object-cover"
                      />
                    </div>
                    {previewBlobId && (
                      <div className="p-2 bg-blue-50 text-blue-700 rounded-md mt-2 text-xs">
                        ✓ Preview uploaded! Blob ID: {previewBlobId.substring(0, 8)}...
                      </div>
                    )}
                  </div>
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

  useEffect(() => {
    const fetchCreatorId = async () => {
      if (!account?.address) return;
      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${packageId}::creator::Creator`,
        },
        options: { showContent: true },
      });
      if (objects.data.length > 0) {
        console.log("Creator ID:", objects.data[0]);
        setCreatorId(objects.data[0].data?.objectId || null);
      } else {
        setCreatorId(null);
      }
    };
    fetchCreatorId();
  }, [account, suiClient]);

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

        {/* Render fields based on content type */}
        {renderContentTypeFields()}

        {/* Publish Button */}
        <Button
          className="w-full bg-blue text-white hover:bg-blue/90"
          onClick={handlePublish}
          disabled={Boolean(isPublishing) || (contentType === "image" && (!selectedImage || !imageFile))}
        >
          {isPublishing ? "Publishing..." : "Publish Content"}
        </Button>
      </div>
    </div>
  );
}

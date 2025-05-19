"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Share2, FileText, ImageIcon } from "lucide-react"
import { useSuiClient, useSignPersonalMessage, useCurrentAccount } from "@mysten/dapp-kit"
import { useParams, useRouter } from "next/navigation"
import { SealClient, SessionKey, getAllowlistedKeyServers, EncryptedObject, NoAccessError } from "@mysten/seal"
import { network, networkConfig } from '@/contracts';
import Link from "next/link"
import { useState as useCopyState } from "react"
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';

const WALRUS_IMAGE_URL_PREFIX = "https://aggregator.walrus-testnet.walrus.space/v1/blobs/";

// Parse Content struct fields from Move object
function parseContentFields(fields: any) {
  return {
    id: fields.id?.id || "",
    creatorId: fields.creator_id || "",
    title: fields.title || "",
    description: fields.description || "",
    walrusReference: fields.walrus_reference || "",
    previewReference: fields.preview_reference || "", // Preview image reference (if any)
    serviceId: fields.service_id || "", // Service ID
    createdAt: fields.created_at || 0,
    creatorAddr: fields.creator_addr || '',
    contentType: fields.content_type || "",
  }
}

// Format address for display (truncated)
function formatAddress(addr: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  // Replace URL-safe characters
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  while (base64.length % 4) base64 += '=';
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function ContentDetail() {
  const params = useParams();
  const router = useRouter();
  const suiClient = useSuiClient();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const currentAccount = useCurrentAccount();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  // Share button state
  const [copied, setCopied] = useCopyState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  const client = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers(network),
    verifyKeyServers: false,
  });

  // Load content data and subscription info from chain
  useEffect(() => {
    async function fetchContentAndSubscription() {
      setLoading(true);
      setError("");
      setDecryptedUrl(null);
      setSessionKey(null);
      try {
        const objectId = params?.id as string;
        if (!objectId) {
          setError("Invalid content id");
          setLoading(false);
          return;
        }
        // Get Content object from Sui
        const resp = await suiClient.getObject({
          id: objectId,
          options: { showContent: true },
        });
        const contentData = (resp?.data?.content as any);
        if (!contentData || contentData.dataType !== "moveObject" || !contentData.fields) {
          setError("Content not found on chain");
          setLoading(false);
          return;
        }
        const parsed = parseContentFields((contentData as any).fields);
        setContent(parsed);
        // Set preview URL (use previewReference if available, otherwise walrusReference)
        const preview = parsed.previewReference || parsed.walrusReference;
        setPreviewUrl(preview ? WALRUS_IMAGE_URL_PREFIX + preview : null);
        // Get packageId
        const pkgId = networkConfig[network].variables.package;
        setPackageId(pkgId);
        // Get user address from dapp-kit
        const account = (currentAccount as any)?.address || null;
        setUserAddress(account);
        // Find serviceId from events
        const events = await suiClient.queryEvents({
          query: { MoveEventType: `${pkgId}::subscription::ServiceCreatedEvent` },
          limit: 100,
        });
        // Find service matching the creator_id
        const matched = events.data.find(e => (e.parsedJson as any)?.creator_id === parsed.creatorId);
        const foundServiceId = (matched?.parsedJson as any)?.service_id || null;
        setServiceId(foundServiceId);
        // Find subscription ID
        if (account && foundServiceId) {
          const owned = await suiClient.getOwnedObjects({
            owner: account,
            options: { showContent: true, showType: true },
            filter: { StructType: `${pkgId}::subscription::Subscription` },
          });
          // Find subscription matching the serviceId
          const sub = owned.data.find(obj => {
            const fields = (obj.data?.content as any)?.fields;
            return fields && fields.service_id === foundServiceId;
          });
          setSubscriptionId((sub?.data?.content as any)?.fields?.id?.id || null);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load content");
      } finally {
        setLoading(false);
      }
    }
    fetchContentAndSubscription();
  }, [params?.id, suiClient, currentAccount]);

  // Decrypt content using contract authorization + SealClient
  async function handleDecrypt() {
    if (!content?.walrusReference || !serviceId || !packageId) return;
    setDecrypting(true);
    setError("");
    
    try {
      // 1. Check if subscription exists
      if (!subscriptionId) {
        setError("SUBSCRIPTION_REQUIRED");
        return;
      }
      
      // 2. Download encrypted data
      const walrusUrl = WALRUS_IMAGE_URL_PREFIX + content.walrusReference;
      const response = await fetch(walrusUrl, { 
        cache: "no-store",
        headers: { "Pragma": "no-cache" }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted data: ${response.status}`);
      }
      
      // 3. Get encrypted data
      const encryptedData = new Uint8Array(await response.arrayBuffer());
      
      // 4. Parse encrypted data to get the original ID
      const encObj = EncryptedObject.parse(encryptedData);
      const originalId = encObj.id;
      
      // 5. Generate session key
      const address = currentAccount?.address || "";
      if (!address) throw new Error("Wallet not connected");
      
      const sessionKey = new SessionKey({ 
        address, 
        packageId,
        ttlMin: 10 
      });
      
      // 6. Sign with wallet
      await new Promise<void>((resolve, reject) => {
        signPersonalMessage(
          { message: sessionKey.getPersonalMessage() },
          {
            onSuccess: async (result) => {
              try {
                await sessionKey.setPersonalMessageSignature(result.signature);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            onError: reject
          }
        );
      });
      
      // 7. Attempt decryption with multiple strategies
      // This function tries to decrypt with a specific ID
      async function attemptDecryption(id: string) {
        try {
          if (!subscriptionId || !serviceId) return false;
          
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::subscription::seal_approve`,
            arguments: [
              tx.pure.vector('u8', fromHex(id)),
              tx.object(subscriptionId),
              tx.object(serviceId),
              tx.object(SUI_CLOCK_OBJECT_ID),
            ],
          });
          
          const txBytes = await tx.build({ 
            client: suiClient, 
            onlyTransactionKind: true 
          });
          
          // Get keys
          await client.fetchKeys({ 
            ids: [id], 
            txBytes, 
            sessionKey,
            threshold: 2 
          });
          
          // Decrypt data
          const decrypted = await client.decrypt({
            data: encryptedData,
            sessionKey,
            txBytes,
          });
          
          // Create decrypted Blob
          const blob = new Blob([decrypted], { 
            type: content.contentType === "image" ? "image/jpeg" : "text/plain" 
          });
          const url = URL.createObjectURL(blob);
          
          // Update state
          setDecryptedUrl(url);
          setSessionKey(sessionKey);
          return true;
        } catch (error) {
          return false;
        }
      }
      
      // Define decryption strategies based on our encryption logic
      // In the encryption function (encryptAndUploadToWalrus), we use:
      // 1. Service ID as prefix + random nonce (primary strategy)
      // 2. Default "0x1" + random nonce (fallback strategy)
      const strategies = [
        { id: serviceId + originalId.substring(serviceId.length) }, // Service ID + original ID suffix
        { id: originalId } // Original ID (in case it was created with default prefix)
      ];
      
      // Try each strategy in sequence
      for (const strategy of strategies) {
        const success = await attemptDecryption(strategy.id);
        if (success) return;
      }
      
      // All strategies failed
      throw new Error("Could not decrypt content. Please check your subscription status.");
      
    } catch (e: any) {
      if (e instanceof NoAccessError || e?.message?.includes("NoAccess") || e?.message?.includes("Access denied")) {
        setError("Access denied: You may not have access to this content, or your subscription has expired");
      } else if (e?.message?.includes("failed to fetch") || e?.message?.includes("Failed to fetch encrypted data")) {
        setError("Network error: Could not retrieve encrypted content");
      } else {
        setError(e.message || "Error during decryption process");
      }
    } finally {
      setDecrypting(false);
    }
  }
  console.log(content);

  // Render content based on type
  const renderContentByType = () => {
    if (!content) return null;
    if (content.contentType === "image") {
      // Show decrypted high-quality image if available
      if (decryptedUrl) {
        return (
          <div className="relative aspect-square overflow-hidden rounded-2xl">
            <Image
              src={decryptedUrl}
              alt={content.title}
              fill
              className="object-cover"
            />
          </div>
        );
      }
      // Show preview image and decrypt button if not decrypted
      return (
        <div className="relative aspect-square overflow-hidden rounded-2xl flex flex-col items-center justify-center bg-gray-100">
          {previewUrl && (
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover opacity-70"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {error === "SUBSCRIPTION_REQUIRED" ? (
              <>
                <p className="text-center text-white bg-black/40 p-2 rounded">You need to subscribe to view this content</p>
                <Button 
                  onClick={() => router.push(`/profile/${content.creatorAddr}`)} 
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Subscribe to Creator
                </Button>
              </>
            ) : (
              <Button onClick={handleDecrypt} disabled={decrypting} className="bg-blue text-white hover:bg-blue/90">
                {decrypting ? "Decrypting..." : "Decrypt to view"}
              </Button>
            )}
          </div>
        </div>
      );
    } else if (content.contentType === "article") {
      // Article content - currently only shows reference or decrypt button
      return (
        <div className="prose prose-lg max-w-none rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">{content.title}</h2>
          <div className="border-t mt-4 pt-4">
            {error === "SUBSCRIPTION_REQUIRED" ? (
              <div className="text-center py-6">
                <p className="mb-4">You need to subscribe to read this article</p>
                <Button 
                  onClick={() => router.push(`/profile/${content.creatorAddr}`)} 
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Subscribe to Creator
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="mb-4 text-muted-foreground">[Encrypted Article]</p>
                <Button onClick={handleDecrypt} disabled={decrypting} className="bg-blue text-white hover:bg-blue/90">
                  {decrypting ? "Decrypting..." : "Decrypt to read"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )
    } else {
      return <p>Unsupported content type: {content.contentType}</p>
    }
  }

  // Get icon for content type
  const getTypeIcon = () => {
    switch (content?.contentType) {
      case "article":
        return <FileText className="h-5 w-5" />
      case "image":
        return <ImageIcon className="h-5 w-5" />
      default:
        return null
    }
  }

  // Show skeleton screen during loading
  if (loading) {
    return (
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Content Display Skeleton */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-200 animate-pulse">
            {/* Image placeholder pulsing effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-300"/>
            </div>
          </div>
          
          {/* Content Info Skeleton */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse"/>
              <div className="w-24 h-6 rounded-full bg-gray-200 animate-pulse"/>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="w-3/4 h-8 bg-gray-200 animate-pulse rounded-lg"/>
              <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-lg ml-4"/>
            </div>
            
            <div className="mt-2 w-full h-20 bg-gray-200 animate-pulse rounded-lg"/>
            
            <div className="mt-4 flex items-center gap-4">
              <div className="w-16 h-6 bg-gray-200 animate-pulse rounded"/>
              <div className="w-24 h-6 bg-gray-200 animate-pulse rounded"/>
            </div>
            
            <div className="mt-6 w-32 h-4 bg-gray-200 animate-pulse rounded"/>
            <div className="mt-6 w-40 h-4 bg-gray-200 animate-pulse rounded"/>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container py-8 md:py-12 text-center text-muted-foreground">Content not found.</div>
    )
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
            <span className="rounded-full bg-muted px-3 py-1 text-sm capitalize">{content.contentType}</span>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{content.title}</h1>
            {/* 复制链接按钮 */}
            <Button
              variant="outline"
              className="flex items-center gap-2 ml-4"
              onClick={async () => {
                  // Share creator's profile link instead of content link
  const creatorProfileUrl = `${window.location.origin}/profile/${content.creatorAddr}`;
  await navigator.clipboard.writeText(creatorProfileUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Share2 className="h-4 w-4" />
              {copied ? "Copied!" : "Share Creator"}
            </Button>
          </div>

          {/* 内容描述 */}
          {content.description && (
            <div className="mt-2 text-base text-muted-foreground whitespace-pre-line">
              {content.description}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4">
            <span className="font-bold">Creator:</span>
            <Link 
              href={`/profile/${content.creatorAddr}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {formatAddress(content.creatorAddr)}
            </Link>
          </div>

          <div className="mt-6 text-xs text-muted-foreground">
            Created at epoch: {content.createdAt}
          </div>

          <div className="mt-6 text-xs text-muted-foreground">
            Walrus Blob ID: {content.walrusReference}
          </div>
          {
             error && error !== "SUBSCRIPTION_REQUIRED" && 
             <div className="container py-8 md:py-12 text-center text-red-500">{error}</div> 
          }
          
        </div>
      </div>
    </div>
  )
} 

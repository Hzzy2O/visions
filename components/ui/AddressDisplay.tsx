import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { generateColorFromAddress } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSuiClient } from "@mysten/dapp-kit";
import { CheckIcon, Copy } from "lucide-react";

export interface AddressDisplayProps {
  // Basic properties
  address: string;

  // Display options
  textDisplayMode?: "short" | "medium" | "full";
  variant?: "default" | "compact";
  showCopyButton?: boolean;
  showExplorerLink?: boolean;
  showAvatar?: boolean;
  avatarShape?: "circle" | "square";

  // Style properties
  size?: "sm" | "md" | "lg";
  className?: string;

  // Explorer options
  explorerUrl?: string;

  // Interaction properties
  onClick?: () => void;
}

export const formatAddress = (
  address: string,
  displayMode: "short" | "medium" | "full",
): string => {
  if (!address) return "";

  // Make sure address is a string and remove any leading/trailing whitespace
  const cleanAddress = address.toString().trim();

  // Ensure address has the 0x prefix
  const normalizedAddress = cleanAddress.startsWith("0x")
    ? cleanAddress
    : `0x${cleanAddress}`;

  if (displayMode === "full") return normalizedAddress;

  if (displayMode === "medium") {
    if (normalizedAddress.length <= 20) return normalizedAddress;
    return `${normalizedAddress.slice(0, 10)}...${normalizedAddress.slice(
      -10,
    )}`;
  }

  // Default: short variant
  if (normalizedAddress.length <= 12) return normalizedAddress;
  return `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`;
};

export const AddressDisplay = ({
  // Basic properties
  address,

  // Display options
  textDisplayMode = "short",
  variant = "default",
  showCopyButton = true,
  showExplorerLink = true,
  showAvatar = true,
  avatarShape = "circle",

  // Style properties
  size = "md",
  className,

  // Explorer options
  explorerUrl,

  // Interaction properties
  onClick,
}: AddressDisplayProps) => {
  // State for copy button
  const [copied, setCopied] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);

  const { network } = useSuiClient();

  // Size mappings
  const sizeClasses = {
    sm: "text-xs h-7",
    md: "text-sm h-8",
    lg: "text-base h-9",
  };

  // Avatar size mappings
  const avatarSizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  // Ensure we have a valid address
  if (!address) {
    return (
      <div
        className={cn(
          "inline-flex items-center text-gray-400 rounded-md bg-gray-100 dark:bg-gray-800 px-3",
          sizeClasses[size],
          className,
        )}
      >
        Invalid address
      </div>
    );
  }

  // Format the address
  const formattedAddress = formatAddress(address, textDisplayMode);

  // Handle copy
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from propagating

    navigator.clipboard.writeText(address.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Handle explorer link click
  const handleExplorerClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }

    if (!showExplorerLink) return;

    // Get the clean address without 0x prefix
    const addressWithoutPrefix = address.toString().replace(/^0x/, "");
    const networkType = network === "mainnet" ? "mainnet" : "testnet";

    // Format the URL using SuiScan format
    const suiscanUrl =
      explorerUrl ||
      `https://suiscan.xyz/${networkType}/account/${addressWithoutPrefix}`;

    window.open(suiscanUrl, "_blank");
  };

  // Get button size based on overall size
  const getButtonSize = (): number => {
    switch (size) {
      case "sm":
        return 14;
      case "lg":
        return 18;
      default:
        return 16;
    }
  };

  const buttonSize = getButtonSize();

  // Display address - either formatted or full on hover
  const displayAddress = showFullAddress
    ? address.toString()
    : formattedAddress;

  // Generate avatar gradient
  const avatarBackground = generateColorFromAddress(address);

  // Avatar shape class
  const avatarShapeClass =
    avatarShape === "circle" ? "rounded-full" : "rounded-md";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md gap-2 bg-gray-100 dark:bg-gray-800 px-3 shadow-sm",
        showExplorerLink ? "cursor-pointer" : "",
        sizeClasses[size],
        variant === "compact" && "p-1 pl-2",
        className,
      )}
      onClick={handleExplorerClick}
    >
      {showAvatar && (
        <div
          className={cn(
            avatarShapeClass,
            avatarSizeClasses[size],
            "overflow-hidden",
          )}
          style={{ background: avatarBackground }}
          aria-hidden="true"
        />
      )}

      <span
        className={cn("font-mono dark:text-gray-200")}
        title={address.toString()}
      >
        {displayAddress}
      </span>

      {showCopyButton && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md"
            aria-label="Copy address"
            title="Copy address"
          >
            {copied ? (
              <CheckIcon size={buttonSize} className="text-green-500" />
            ) : (
              <Copy size={buttonSize} />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AddressDisplay;

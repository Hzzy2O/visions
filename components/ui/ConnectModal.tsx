
"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Define wallet option type
export interface WalletOption {
  id: string;
  name: string;
  description?: string;
  icon?: string | React.ReactNode;
  installed?: boolean;
  downloadUrl?: string;
}

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => void;
  className?: string;
  title?: string;
  walletOptions?: WalletOption[];
  showRecentlyConnected?: boolean;
  recentWallets?: string[];
  logo?: string | React.ReactNode;
  description?: string;
  installedWallets?: string[];
  renderWalletItem?: (wallet: WalletOption) => React.ReactNode;
  qrCode?: {
    uri: string;
    imageUrl?: string;
  };
}

export default function ConnectModal({
  isOpen,
  onClose,
  onConnect,
  className,
  title = "Connect Wallet",
  walletOptions = [],
  showRecentlyConnected = true,
  recentWallets = [],
  logo,
  description = "Choose how you want to connect. If you don't have a wallet, you can select a provider and create one.",
  installedWallets = [],
  renderWalletItem,
  qrCode,
}: ConnectModalProps) {
  const [connectingWallet, setConnectingWallet] = useState<WalletOption | null>(
    null
  );
  const [showQR, setShowQR] = useState(false);
  const [showAllWallets, setShowAllWallets] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Handle wallet connection and any side effects
  useEffect(() => {
    // Handle connecting to a specific wallet
    if (connectingWallet) {
      const timer = setTimeout(() => {
        if (installedWallets.includes(connectingWallet.id)) {
          connect(connectingWallet.id);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [connectingWallet, installedWallets]);

  if (!isOpen) return null;

  // Filter installed wallets
  const installed = walletOptions.filter((wallet) =>
    installedWallets.includes(wallet.id)
  );
  const notInstalled = walletOptions.filter(
    (wallet) => !installedWallets.includes(wallet.id)
  );

  // Sort wallets with recent at the top
  const sortedWallets = [
    ...installed.filter((wallet) => recentWallets.includes(wallet.id)),
    ...installed.filter((wallet) => !recentWallets.includes(wallet.id)),
    ...notInstalled,
  ];

  // Display logic
  const walletsToShow = showAllWallets
    ? sortedWallets
    : sortedWallets.slice(0, 5);

  const connect = (walletId: string) => {
    onConnect(walletId);
    onClose();
  };

  const handleBack = () => {
    setConnectingWallet(null);
    setShowQR(false);
  };

  const defaultRenderWalletItem = (wallet: WalletOption) => (
    <div
      key={wallet.id}
      className={cn(
        "flex items-center justify-between p-3 my-1 rounded-lg",
        "transition-colors duration-200 cursor-pointer",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        installedWallets.includes(wallet.id)
          ? "border border-lime/50 bg-lime/5"
          : "border border-gray-200 dark:border-gray-700"
      )}
      onClick={() => setConnectingWallet(wallet)}
    >
      <div className="flex items-center">
        {typeof wallet.icon === "string" ? (
          <div className="w-10 h-10 mr-3 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Image
              src={wallet.icon}
              alt={wallet.name}
              width={30}
              height={30}
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 mr-3 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {wallet.icon}
          </div>
        )}
        <div>
          <div className="text-sm font-medium flex items-center">
            {wallet.name}
            {installedWallets.includes(wallet.id) && (
              <span className="ml-2 text-xs bg-lime/20 text-lime px-1.5 py-0.5 rounded-full">
                Installed
              </span>
            )}
          </div>
          {wallet.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {wallet.description}
            </div>
          )}
        </div>
      </div>
      <div className="text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
        className
      )}
    >
      <div
        ref={modalRef}
        className={cn(
          "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden",
          "w-full max-w-md max-h-[85vh] overflow-y-auto"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {connectingWallet ? connectingWallet.name : title}
          </h3>
          <button
            onClick={connectingWallet ? handleBack : onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {connectingWallet ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!connectingWallet && !showQR && (
            <>
              {/* Logo and Description */}
              <div className="text-center mb-6">
                {logo && typeof logo === "string" ? (
                  <div className="mx-auto w-16 h-16 mb-4">
                    <img
                      src={logo as string}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  logo && <div className="mx-auto mb-4">{logo}</div>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              </div>

              {/* Recent Wallets */}
              {showRecentlyConnected && recentWallets.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
                    Recently Connected
                  </h4>
                  {walletOptions
                    .filter((wallet) => recentWallets.includes(wallet.id))
                    .map((wallet) =>
                      renderWalletItem
                        ? renderWalletItem(wallet)
                        : defaultRenderWalletItem(wallet)
                    )}
                </div>
              )}

              {/* Available Wallets */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
                  Available Wallets
                </h4>
                {walletsToShow.map((wallet) =>
                  renderWalletItem
                    ? renderWalletItem(wallet)
                    : defaultRenderWalletItem(wallet)
                )}
              </div>

              {/* Show more button */}
              {sortedWallets.length > 5 && !showAllWallets && (
                <button
                  className="w-full mt-2 text-center text-sm text-blue hover:text-blue-600 dark:text-blue dark:hover:text-blue-400"
                  onClick={() => setShowAllWallets(true)}
                >
                  Show more wallets
                </button>
              )}

              {/* QR Code option */}
              {qrCode && (
                <div className="mt-4 pt-4 border-t dark:border-gray-800">
                  <button
                    className="w-full text-center py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setShowQR(true)}
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <rect width="6" height="6" x="3" y="3" rx="1" />
                        <rect width="6" height="6" x="15" y="3" rx="1" />
                        <rect width="6" height="6" x="3" y="15" rx="1" />
                        <path d="M15 15h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-1.5a1.5 1.5 0 0 1-1.5-1.5v-1.5a1.5 1.5 0 0 1 1.5-1.5Z" />
                      </svg>
                      Connect with QR code
                    </div>
                  </button>
                </div>
              )}
            </>
          )}

          {connectingWallet && !showQR && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                {typeof connectingWallet.icon === "string" ? (
                  <Image
                    src={connectingWallet.icon}
                    alt={connectingWallet.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                ) : (
                  connectingWallet.icon
                )}
              </div>
              <h3 className="text-lg font-medium mb-2">
                Opening {connectingWallet.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {installedWallets.includes(connectingWallet.id)
                  ? "Confirm connection in the extension"
                  : "You need to install this wallet"}
              </p>

              {!installedWallets.includes(connectingWallet.id) &&
                connectingWallet.downloadUrl && (
                  <a
                    href={connectingWallet.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
                  >
                    Install {connectingWallet.name}
                  </a>
                )}
            </div>
          )}

          {showQR && qrCode && (
            <div className="text-center py-4">
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                {qrCode.imageUrl ? (
                  <img
                    src={qrCode.imageUrl}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                    <p className="text-sm text-gray-500">QR Code Placeholder</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Scan with your phone's camera or wallet app to connect
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

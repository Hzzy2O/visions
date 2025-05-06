import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { useWallets, useConnectWallet } from "@mysten/dapp-kit";

export interface WalletOption {
  id: string;
  name: string;
  logo: string;
  description: string;
}

export interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletOptions?: WalletOption[];
  /** Optional theme mode, defaults to 'light' */
  themeMode?: "light" | "dark";
}

type ModalView =
  | "wallet-list"
  | "what-is-wallet"
  | "getting-started"
  | "connection-status";

const convertWalletToOption = (wallet: any): WalletOption => {
  return {
    id: wallet.name,
    name: wallet.name,
    logo: wallet.icon || "",
    description: `Connect to ${wallet.name}`,
  };
};

export const ConnectWalletModal = ({
  isOpen,
  onClose,
  walletOptions,
  themeMode = "light", // Default to light mode
}: ConnectWalletModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<ModalView>("wallet-list");
  const [connectingWallet, setConnectingWallet] = useState<WalletOption | null>(
    null,
  );
  const [hoverWallet, setHoverWallet] = useState<string | null>(null);

  const installedWallets = useWallets();
  const {
    mutate: connect,
    isPending: isConnecting,
    error: connectionError,
  } = useConnectWallet();

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = "";
        const timer = setTimeout(() => {
          setMounted(false);
          if (document.body.style.overflow === "hidden") {
            document.body.style.overflow = "";
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
    return () => {
      setMounted(false);
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  const resetModal = useCallback(() => {
    setCurrentView("wallet-list");
    setConnectingWallet(null);
  }, []);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  useEffect(() => {
    if (connectingWallet && !isConnecting && !connectionError) {
      console.log(`Successfully connected to ${connectingWallet.name}`);
      const timer = setTimeout(() => {
        handleClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnecting, connectionError, connectingWallet, handleClose]);

  if (!mounted) {
    return null;
  }

  const availableWallets =
    walletOptions ||
    (installedWallets.length > 0
      ? installedWallets.map((wallet) => convertWalletToOption(wallet))
      : []);

  const handleWalletSelect = async (walletOption: WalletOption) => {
    setConnectingWallet(walletOption);
    setCurrentView("connection-status");

    const walletToConnect = installedWallets.find(
      (w) => w.name === walletOption.name,
    );

    if (!walletToConnect) {
      console.error(
        `Could not find installed wallet adapter for ${walletOption.name}`,
      );
      setCurrentView("wallet-list");
      setConnectingWallet(null);
      return;
    }

    console.log(
      `Attempting connect via useConnectWallet for ${walletToConnect.name}...`,
    );
    connect(
      { wallet: walletToConnect },
      {
        onSuccess: () => {
          console.log(
            `useConnectWallet onSuccess callback for ${walletToConnect.name}`,
          );
        },
        onError: (err) => {
          console.error(
            `useConnectWallet onError callback for ${walletToConnect.name}:`,
            err,
          );
        },
      },
    );
  };

  const handleBack = () => {
    setConnectingWallet(null);
    setCurrentView("wallet-list");
  };

  const handleRetry = useCallback(() => {
    if (connectingWallet) {
      const walletToConnect = installedWallets.find(
        (w) => w.name === connectingWallet.name,
      );
      if (!walletToConnect) {
        console.error(
          `Could not find installed wallet adapter for retry: ${connectingWallet.name}`,
        );
        handleBack();
        return;
      }

      console.log(`Retrying connection for ${walletToConnect.name}`);
      // Reset the error state before retrying
      setConnectingWallet(null);
      setTimeout(() => {
        setConnectingWallet(connectingWallet);
        connect(
          { wallet: walletToConnect },
          {
            onSuccess: () =>
              console.log(`Retry onSuccess for ${connectingWallet.name}`),
            onError: (err) =>
              console.error(`Retry onError for ${connectingWallet.name}:`, err),
          },
        );
      }, 100);
    }
  }, [connectingWallet, installedWallets, connect, handleBack]);

  const defaultRenderWalletItem = (wallet: WalletOption) => (
    <div
      key={wallet.id}
      className={cn(
        "flex cursor-pointer items-center rounded-lg p-3 transition-all duration-200",
        "border border-transparent",
        "hover:bg-blue/10 hover:border-blue/20 dark:hover:bg-blue/20 dark:hover:border-blue/30",
        "relative overflow-hidden",
        hoverWallet === wallet.id &&
          "bg-gradient-to-r from-blue/5 to-lime/5 border-blue/30",
      )}
      onClick={() => handleWalletSelect(wallet)}
      onMouseEnter={() => setHoverWallet(wallet.id)}
      onMouseLeave={() => setHoverWallet(null)}
    >
      {hoverWallet === wallet.id && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue/5 via-lime/5 to-blue/5 animate-pulse opacity-30" />
      )}
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-md z-10",
          "bg-gradient-to-br from-blue/20 to-lime/20 dark:from-blue/30 dark:to-lime/30",
          "shadow-sm",
        )}
      >
        {wallet.logo ? (
          <img src={wallet.logo} alt={wallet.name} className="h-7 w-7" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue to-lime" />
        )}
      </div>
      <div className="ml-3 z-10">
        <h4
          className={cn(
            "font-medium",
            "text-gray-900 dark:text-white", // Light/Dark text color for wallet name
            "flex items-center",
          )}
        >
          {wallet.name}
          {hoverWallet === wallet.id && (
            <span className="ml-2 text-xs text-blue dark:text-lime bg-blue/10 dark:bg-blue/20 px-2 py-0.5 rounded-full">
              Connect
            </span>
          )}
        </h4>
        <p
          className={cn(
            "text-xs",
            "text-gray-500 dark:text-gray-400", // Light/Dark text color for wallet description
          )}
        >
          {wallet.description}
        </p>
      </div>
    </div>
  );

  const defaultRenderWhatIsWallet = () => (
    <>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          What is a Wallet?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          A wallet is a secure digital tool for managing your blockchain assets
          (like SUI or NFTs) and interacting with decentralized applications
          (dApps).
        </p>
      </div>
    </>
  );

  const defaultRenderGettingStarted = () => (
    <>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Getting Started
        </h3>
        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <li>
            <b>Choose & Install:</b> Select a compatible Sui wallet (e.g., from
            the app store or official website) and install it.
          </li>
          <li>
            <b>Create/Import:</b> Follow the wallet&apos;s instructions to
            create a new account or import an existing one. Keep your recovery
            phrase safe!
          </li>
          <li>
            <b>Connect:</b> Return here, select your wallet from the list, and
            approve the connection request in your wallet app.
          </li>
        </ol>
      </div>
    </>
  );

  const defaultRenderConnectionStatus = (wallet: WalletOption) => (
    <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
      <div
        className={cn(
          "mb-6 flex h-20 w-20 items-center justify-center rounded-full",
          "bg-gradient-to-br from-blue/20 to-lime/20 dark:from-blue/30 dark:to-lime/30",
          "shadow-lg shadow-blue/10 dark:shadow-blue/20",
        )}
      >
        {wallet.logo ? (
          <img src={wallet.logo} alt={wallet.name} className="h-12 w-12" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue to-lime" />
        )}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {wallet.name}
      </h3>

      {isConnecting && (
        <>
          <div className="my-8 relative">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue border-t-lime"></div>
            <div className="absolute inset-0 h-10 w-10 animate-ping opacity-30 rounded-full border-2 border-blue"></div>
          </div>
          <p className="text-sm font-medium text-blue dark:text-lime mb-2">
            Connecting to {wallet.name}...
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/70 px-3 py-2 rounded-md">
            Please approve the connection request in {wallet.name}.
          </p>
        </>
      )}

      {!isConnecting &&
        !connectionError &&
        connectingWallet?.name === wallet.name && (
          <>
            <div className="my-8 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-lime to-green-500 shadow-lg shadow-lime/20">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-lime mb-2">
              Successfully connected to {wallet.name}!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Closing...
            </p>
          </>
        )}

      {connectionError && connectingWallet?.name === wallet.name && (
        <>
          <div className="my-6 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/20">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Failed to connect to {wallet.name}.
          </p>
          <p className="text-xs text-red-400 mb-4 max-w-xs text-center break-words bg-red-50 dark:bg-red-950/30 p-2 rounded-md">
            {connectionError?.message || "An unknown error occurred."}
          </p>
          <button
            className={cn(
              "rounded-md px-6 py-2.5 text-white transition-all duration-200",
              "bg-gradient-to-r from-blue to-lime hover:from-blue/90 hover:to-lime/90",
              "dark:from-blue dark:to-lime dark:hover:from-blue/90 dark:hover:to-lime/90",
              "shadow-md shadow-blue/20 hover:shadow-lg hover:shadow-lime/30",
              "font-medium cursor-pointer",
              "hover:scale-105 active:scale-95"
            )}
            onClick={() => handleRetry()}
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </span>
          </button>
        </>
      )}
    </div>
  );

  const renderInfoColumn = () => (
    <div className="p-6 flex flex-col h-full bg-gradient-to-br from-blue/5 via-transparent to-lime/5 dark:from-blue/10 dark:via-transparent dark:to-lime/10">
      <div className="mb-4 flex items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue/20 dark:bg-blue/30 mr-3">
          <svg
            className="h-5 w-5 text-blue dark:text-lime"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue dark:text-lime">
          What is a Wallet?
        </h3>
      </div>
      <div className="flex-grow relative">
        <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue/20 via-lime/20 to-transparent"></div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 pl-3">
          A wallet is a secure digital tool for managing your blockchain assets
          (like SUI or NFTs) and interacting with decentralized applications
          (dApps).
        </p>
        <div className="mt-4 rounded-lg border border-blue/20 dark:border-lime/20 p-3 bg-white/50 dark:bg-gray-800/50 shadow-sm">
          <h4 className="text-xs font-medium text-blue dark:text-lime mb-2">
            Benefits:
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 pl-4 list-disc">
            <li>Secure access to Web3 services</li>
            <li>Full control of your digital assets</li>
            <li>Proof of ownership on-chain</li>
          </ul>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-blue/10 dark:border-lime/10">
        <div className="flex items-center justify-center">
          <span className="text-xs text-blue/60 dark:text-lime/60 mr-2">
            Powered by
          </span>
          <span className="text-xs font-bold bg-gradient-to-r from-blue to-lime bg-clip-text text-transparent">
            VISIONS
          </span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case "what-is-wallet":
        return defaultRenderWhatIsWallet();
      case "getting-started":
        return defaultRenderGettingStarted();
      case "connection-status":
        return (
          connectingWallet && defaultRenderConnectionStatus(connectingWallet)
        );
      case "wallet-list":
      default:
        return (
          <>
            <div
              className={cn(
                "flex items-center justify-between px-6 py-5 relative z-10",
                "border-b border-blue/10 dark:border-lime/10",
                "bg-gradient-to-r from-blue/5 to-transparent dark:from-blue/10 dark:to-transparent",
              )}
            >
              <div className="flex items-center">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue to-lime mr-3"></div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-blue to-lime bg-clip-text text-transparent">
                  Connect Wallet
                </h3>
              </div>
              <button
                type="button"
                className={cn(
                  "rounded-full p-2 transition-all duration-200",
                  "text-gray-500 hover:bg-red-50 hover:text-red-500", // Light mode hover
                  "dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400", // Dark mode hover
                  "hover:rotate-90",
                )}
                onClick={handleClose}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>

            <div className="flex min-h-[400px] relative z-10">
              <div
                className={cn(
                  "w-3/5 border-r flex flex-col",
                  "border-blue/10 dark:border-lime/10",
                )}
              >
                <div className="p-6 flex-grow overflow-y-auto">
                  <div className="mb-4 flex items-center">
                    <div className="h-1 w-6 bg-blue mr-2 rounded-full"></div>
                    <p className="text-sm text-blue dark:text-lime font-medium">
                      Choose your wallet
                    </p>
                    <div className="h-1 w-6 bg-lime ml-2 rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    {availableWallets.map((wallet) =>
                      defaultRenderWalletItem(wallet),
                    )}
                  </div>
                </div>
                <div
                  className={cn(
                    "border-t px-6 py-3 mt-auto",
                    "border-blue/10 dark:border-lime/10",
                    "bg-gradient-to-b from-transparent to-blue/5 dark:from-transparent dark:to-blue/10",
                  )}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    By connecting, you agree to the{" "}
                    <span className="text-blue dark:text-lime">
                      Terms & Privacy Policy
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "w-2/5",
                  "bg-gradient-to-br from-blue/5 to-lime/5 dark:from-blue/10 dark:to-lime/10",
                )}
              >
                {renderInfoColumn()}
              </div>
            </div>
          </>
        );
    }
  };

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity",
        isOpen ? "opacity-100" : "opacity-0",
        !isOpen && "pointer-events-none",
        themeMode === "dark" ? "dark" : "", // Apply dark class based on themeMode
      )}
    >
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-sm transition-opacity",
          "bg-black/30 dark:bg-black/50", // Adjusted backdrop opacity for light/dark
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          "relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-xl transition-all",
          "bg-white dark:bg-[#0A1428]", // Light/Dark background
          "border border-blue/30 dark:border-blue/30", // Updated Light/Dark border
          "bg-gradient-to-br from-white to-blue/5 dark:from-[#0A1428] dark:to-blue/10",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-lime/5 dark:bg-lime/10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue/5 dark:bg-blue/10 blur-3xl"></div>
        </div>

        {currentView !== "wallet-list" && !isConnecting && (
          <button
            type="button"
            className={cn(
              "absolute top-4 left-4 rounded-full p-2 z-10",
              "text-blue hover:bg-blue/10 hover:text-blue", // Light mode hover
              "dark:text-lime dark:hover:bg-lime/10 dark:hover:text-lime", // Dark mode hover
              "transition-all duration-200",
            )}
            onClick={handleBack}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="sr-only">Back</span>
          </button>
        )}

        {renderContent()}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConnectWalletModal;

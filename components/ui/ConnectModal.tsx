import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { useWallets, useConnectWallet } from '@mysten/dapp-kit';

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
  themeMode?: 'light' | 'dark'; 
}

type ModalView = 'wallet-list' | 'what-is-wallet' | 'getting-started' | 'connection-status';

const convertWalletToOption = (wallet: any): WalletOption => {
  return {
    id: wallet.name,
    name: wallet.name,
    logo: wallet.icon || '',
    description: `Connect to ${wallet.name}`,
  };
};

export const ConnectWalletModal = ({
  isOpen,
  onClose,
  walletOptions,
  themeMode = 'light', // Default to light mode
}: ConnectWalletModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<ModalView>('wallet-list');
  const [connectingWallet, setConnectingWallet] = useState<WalletOption | null>(null);
  
  const installedWallets = useWallets();
  const { mutate: connect, isPending: isConnecting, error: connectionError } = useConnectWallet();

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
        const timer = setTimeout(() => {
          setMounted(false);
          if (document.body.style.overflow === 'hidden') {
            document.body.style.overflow = '';
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
    return () => {
      setMounted(false);
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  const resetModal = useCallback(() => {
    setCurrentView('wallet-list');
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

  const availableWallets = walletOptions || 
    (installedWallets.length > 0 ? installedWallets.map(wallet => convertWalletToOption(wallet)) : []);

  const handleWalletSelect = async (walletOption: WalletOption) => {
    setConnectingWallet(walletOption);
    setCurrentView('connection-status');
    
    const walletToConnect = installedWallets.find(w => w.name === walletOption.name);

    if (!walletToConnect) {
      console.error(`Could not find installed wallet adapter for ${walletOption.name}`);
      setCurrentView('wallet-list');
      setConnectingWallet(null);
      return;
    }
    
    console.log(`Attempting connect via useConnectWallet for ${walletToConnect.name}...`);
    connect(
      { wallet: walletToConnect }, 
      {
        onSuccess: () => {
          console.log(`useConnectWallet onSuccess callback for ${walletToConnect.name}`);
        },
        onError: (err) => {
          console.error(`useConnectWallet onError callback for ${walletToConnect.name}:`, err);
        },
      }
    );
  };

  const handleBack = () => {
    setConnectingWallet(null);
    setCurrentView('wallet-list');
  };

  const handleRetry = () => {
    if (connectingWallet) {
      const walletToConnect = installedWallets.find(w => w.name === connectingWallet.name);
      if (!walletToConnect) {
         console.error(`Could not find installed wallet adapter for retry: ${connectingWallet.name}`);
         handleBack();
         return;
      }

      console.log(`Retrying connection for ${walletToConnect.name}`);
      connect(
        { wallet: walletToConnect },
        {
          onSuccess: () => console.log(`Retry onSuccess for ${connectingWallet.name}`),
          onError: (err) => console.error(`Retry onError for ${connectingWallet.name}:`, err),
        }
      );
    }
  };

  const defaultRenderWalletItem = (wallet: WalletOption) => (
    <div
      key={wallet.id}
      className={cn(
        "flex cursor-pointer items-center rounded-lg p-2.5 transition-colors", 
        "hover:bg-gray-100 dark:hover:bg-gray-800/50" 
      )}
      onClick={() => handleWalletSelect(wallet)}
    >
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-md",
        "bg-gray-100 dark:bg-gray-800" // Simplified background for logo container
      )}>
        {wallet.logo ? (
          <img src={wallet.logo} alt={wallet.name} className="h-6 w-6" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-[#3890E3]" /> // Placeholder logo color (adjust if needed)
        )}
      </div>
      <div className="ml-3">
        <h4 className={cn(
          "font-medium", 
          "text-gray-900 dark:text-white" // Light/Dark text color for wallet name
        )}>{wallet.name}</h4>
        <p className={cn(
          "text-xs", 
          "text-gray-500 dark:text-gray-400" // Light/Dark text color for wallet description
        )}>{wallet.description}</p>
      </div>
    </div>
  );

  const defaultRenderWhatIsWallet = () => (
    <>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">What is a Wallet?</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          A wallet is a secure digital tool for managing your blockchain assets (like SUI or NFTs) and interacting with decentralized applications (dApps).
        </p>
      </div>
    </>
  );

  const defaultRenderGettingStarted = () => (
    <>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Getting Started</h3>
        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <li><b>Choose & Install:</b> Select a compatible Sui wallet (e.g., from the app store or official website) and install it.</li>
          <li><b>Create/Import:</b> Follow the wallet&apos;s instructions to create a new account or import an existing one. Keep your recovery phrase safe!</li>
          <li><b>Connect:</b> Return here, select your wallet from the list, and approve the connection request in your wallet app.</li>
        </ol>
      </div>
    </>
  );

  const defaultRenderConnectionStatus = (wallet: WalletOption) => (
    <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
      <div className={cn(
        "mb-6 flex h-16 w-16 items-center justify-center rounded-full",
        "bg-[#E1F3FF] dark:bg-[#1E3A8A]/20" // Light/Dark background for logo container
      )}>
        {wallet.logo ? (
          <img src={wallet.logo} alt={wallet.name} className="h-10 w-10" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-[#3890E3]" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{wallet.name}</h3>
      
      {isConnecting && (
        <>
          <div className="my-6 h-8 w-8 animate-spin rounded-full border-2 border-[#3890E3] border-t-transparent"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Connecting to {wallet.name}...
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Please approve the connection request in {wallet.name}.
          </p>
        </>
      )}
      
      {!isConnecting && !connectionError && connectingWallet?.name === wallet.name && (
         <>
          <div className="my-6 flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Successfully connected to {wallet.name}! Closing...
          </p>
        </>
      )}
      
      {connectionError && connectingWallet?.name === wallet.name && (
        <>
          <div className="my-6 flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Failed to connect to {wallet.name}.
          </p>
           <p className="text-xs text-red-400 mb-4 max-w-xs text-center break-words">
             {connectionError?.message || 'An unknown error occurred.'}
           </p>
          <button 
            className={cn(
              "rounded-md px-4 py-2 text-white transition-colors",
              "bg-[#3890E3] hover:bg-[#4A90E2]", // Use Sui blue for button
              "dark:bg-[#3890E3] dark:hover:bg-[#4A90E2]"
            )}
            onClick={handleRetry}
          >
            Retry
          </button>
        </>
      )}
    </div>
  );

  const renderInfoColumn = () => (
    <div className="p-6 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What is a Wallet?</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
        A wallet is a secure digital tool for managing your blockchain assets (like SUI or NFTs) and interacting with decentralized applications (dApps).
      </p>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'what-is-wallet':
        return defaultRenderWhatIsWallet();
      case 'getting-started':
        return defaultRenderGettingStarted();
      case 'connection-status':
        return connectingWallet && defaultRenderConnectionStatus(connectingWallet);
      case 'wallet-list':
      default:
        return (
          <>
            <div className={cn(
              "flex items-center justify-between border-b px-6 py-4",
              "border-gray-100 dark:border-gray-700/50" // Subtler border color
            )}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Connect Wallet</h3>
              <button
                type="button"
                className={cn(
                  "rounded-full p-1", 
                  "text-gray-500 hover:bg-gray-100 hover:text-gray-700", // Light mode hover
                  "dark:text-gray-400 dark:hover:bg-[#1E3A8A]/10 dark:hover:text-white" // Dark mode hover
                )}
                onClick={handleClose}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <div className="flex min-h-[400px]">
              <div className={cn(
                "w-3/5 border-r flex flex-col",
                "border-gray-100 dark:border-gray-700/50" 
                )}>
                <div className="p-6 flex-grow overflow-y-auto">
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Choose your preferred wallet to connect.</p>
                  <div className="space-y-3">
                    {availableWallets.map((wallet) => (
                      defaultRenderWalletItem(wallet)
                    ))}
                  </div>
                </div>
                <div className={cn(
                  "border-t px-6 py-3 mt-auto",
                  "border-gray-100 dark:border-gray-700/50" 
                  )}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">By connecting, you agree to the Terms & Privacy Policy.</p>
                </div>
              </div>

              <div className={cn(
                "w-2/5",
                "bg-gray-50 dark:bg-[#0A1428]/50" // Light/Dark background for info column
                )}>
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
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity',
        isOpen ? 'opacity-100' : 'opacity-0',
        !isOpen && 'pointer-events-none',
        themeMode === 'dark' ? 'dark' : '' // Apply dark class based on themeMode
      )}
    >
      <div 
        className={cn(
          'absolute inset-0 backdrop-blur-sm transition-opacity',
          'bg-black/30 dark:bg-black/50', // Adjusted backdrop opacity for light/dark
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          'relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-xl transition-all',
          'bg-white dark:bg-[#0A1428]', // Light/Dark background
          'border border-gray-200 dark:border-[#1E3A8A]/30', // Light/Dark border
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        {currentView !== 'wallet-list' && !isConnecting && (
          <button
            type="button"
            className={cn(
              "absolute top-4 left-4 rounded-full p-1 z-10",
              "text-gray-500 hover:bg-gray-100 hover:text-gray-700", // Light mode hover
              "dark:text-gray-400 dark:hover:bg-[#1E3A8A]/10 dark:hover:text-white" // Dark mode hover
            )}
            onClick={handleBack}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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


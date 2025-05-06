import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface ConnectButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  connectedText?: string;
  isConnected?: boolean;
  walletAddress?: string;
  showAddress?: boolean;
  walletName?: string;
  walletIcon?: React.ReactNode;
  onConnect?: (walletId?: string) => void;
  onDisconnect?: () => void;
  avatarUrl?: string;
  balance?: {
    amount: number;
    symbol: string;
  };
  showBalance?: boolean;
}

/**
 * ConnectButton - A button for connecting to web3 wallets
 */
export const ConnectButton = ({
  className,
  variant = 'primary',
  size = 'md',
  text = 'Connect Wallet',
  connectedText = 'Connected',
  isConnected = false,
  walletAddress = '',
  showAddress = true,
  walletName,
  walletIcon,
  onConnect,
  onDisconnect,
  avatarUrl,
  balance,
  showBalance = false,
  ...props
}: ConnectButtonProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Format address for display (shortened format)
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (amount: number, symbol: string) => {
    return `${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    })} ${symbol}`;
  };

  const handleButtonClick = () => {
    if (isConnected) {
      // If connected, toggle dropdown
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      // If not connected, directly trigger connect callback
      onConnect?.('default-wallet-id');
    }
  };

  const handleDisconnect = () => {
    setIsDropdownOpen(false);
    onDisconnect?.();
  };

  const handleClickOutside = () => {
    setIsDropdownOpen(false);
  };

  // Button inner content
  const buttonContent = isConnected ? (
    <div className="flex items-center">
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt="Wallet Avatar" 
          className="w-5 h-5 rounded-full mr-2 object-cover"
        />
      ) : walletIcon ? (
        <span className="mr-2">{walletIcon}</span>
      ) : (
        <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />
      )}
      <div className="flex items-center">
        {showAddress && walletAddress ? formatAddress(walletAddress) : (walletName || connectedText)}
        {showBalance && balance && (
          <span className="ml-2 text-xs opacity-80 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {formatBalance(balance.amount, balance.symbol)}
          </span>
        )}
      </div>
    </div>
  ) : (
    text
  );

  return (
    <div className="relative">
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          // Variant styles - 优化支持暗色/亮色模式
          variant === 'primary' && 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
          variant === 'secondary' && 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
          variant === 'outline' && 'border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800/50',
          // Size styles
          size === 'sm' && 'h-8 px-3 text-sm',
          size === 'md' && 'h-10 px-4 text-base',
          size === 'lg' && 'h-12 px-6 text-lg',
          // Custom styles
          className
        )}
        onClick={handleButtonClick}
        {...props}
      >
        {buttonContent}
        {isConnected && (
          <svg
            className={cn("ml-2 h-4 w-4 transition-transform", isDropdownOpen && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Connected state dropdown */}
      {isConnected && isDropdownOpen && (
        <div 
          className={cn(
            "absolute right-0 mt-2 w-48 rounded-md border z-50",
            "dark:bg-gray-800 dark:border-gray-700 dark:text-white",
            "bg-white border-gray-200 text-gray-800",
            "shadow-[0_4px_20px_0px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_0px_rgba(0,0,0,0.5)]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Profile section */}
          <div className="p-4 border-b dark:border-gray-700 border-gray-200">
            <div className="flex items-center">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Wallet Avatar" 
                  className="w-12 h-12 rounded-full mr-3 object-cover border-2 dark:border-gray-600 border-gray-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-full mr-3 bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white">
                  {walletAddress ? walletAddress.substring(2, 4).toUpperCase() : '??'}
                </div>
              )}
              <div>
                <p className="text-sm dark:text-white text-gray-800 font-medium">
                  {walletName || 'My Wallet'}
                </p>
                <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">
                  {formatAddress(walletAddress)}
                </p>
                {balance && (
                  <div className="flex items-center text-xs dark:text-gray-300 text-gray-600 font-medium mt-1 bg-gray-100 dark:bg-gray-700/70 px-2 py-0.5 rounded-full max-w-fit">
                    {formatBalance(balance.amount, balance.symbol)}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions section */}
          <div className="py-1">
            <button
              className="w-full text-left block px-4 py-2 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-700 hover:bg-gray-100"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(walletAddress);
                }
              }}
            >
              Copy Address
            </button>
            {walletAddress && (
              <a
                href={`https://explorer.sui.io/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left block px-4 py-2 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-700 hover:bg-gray-100"
              >
                View in Explorer
              </a>
            )}
            <button
              className="w-full text-left block px-4 py-2 text-sm dark:text-red-400 text-red-500 dark:hover:bg-gray-700 hover:bg-gray-100"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Backdrop when dropdown is open */}
      {isConnected && isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleClickOutside}
        />
      )}
    </div>
  );
};

export default ConnectButton; 

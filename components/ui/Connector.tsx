"use client";

import React, { useState, useCallback } from "react";
// Import local components being wrapped
import { ConnectButton } from "./ConnectButton";
import { ConnectWalletModal } from "./ConnectModal";
// Import dapp-kit hooks for state management
import {
  useDisconnectWallet,
  useCurrentWallet, // Use useCurrentWallet for simpler access to connected wallet info
} from "@mysten/dapp-kit";

/**
 * Connector Component
 *
 * This component integrates the ConnectButton and ConnectWalletModal,
 * managing the connection state and modal visibility using @mysten/dapp-kit.
 */
export const Connector = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dapp-kit hooks
  const { mutate: disconnect } = useDisconnectWallet();
  const { currentWallet, connectionStatus } = useCurrentWallet(); // Use hook for current wallet

  // Determine connection state based on the hook
  const isConnected = connectionStatus === "connected";

  // Get the current account address if connected
  const currentAccount = currentWallet?.accounts[0]; // Get the first account from the current wallet

  const handleConnectClick = useCallback(() => {
    // Open the modal only if not already connected
    if (!isConnected) {
      setIsModalOpen(true);
    }
    // If connected, the button's internal dropdown handles disconnect
  }, [isConnected]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setIsModalOpen(false); // Ensure modal is closed on disconnect
  }, [disconnect]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Callback for when a wallet is successfully selected/connected via the modal
  // This might be needed if the modal itself triggers the final connection step
  const handleModalConnect = useCallback((walletIdentifier: string) => {
    // Depending on how ConnectWalletModal works, you might trigger connection here
    // or rely on dapp-kit's WalletProvider handling it internally.
    // For now, we just close the modal as WalletProvider often handles the connect flow.
    console.log("Wallet selected/connected via modal:", walletIdentifier);
    setIsModalOpen(false);
  }, []);

  return (
    <>
      {/* Render the button, passing state and callbacks */}
      <ConnectButton
        isConnected={isConnected}
        walletAddress={currentAccount?.address} // Pass address from current account
        walletName={currentWallet?.name} // Pass name from current wallet
        avatarUrl={currentWallet?.icon} // Pass icon as avatar URL (if compatible)
        onConnect={handleConnectClick} // Opens modal when disconnected
        onDisconnect={handleDisconnect} // Handles disconnect from button dropdown
        // Add other props like balance display if needed, deriving data similarly
        // balance={...}
        // showBalance={true}
      />

      {/* Render the modal, controlled by state */}
      <ConnectWalletModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        // Pass the connect handler if the modal needs it
        // onConnect={handleModalConnect} // Assuming modal provides the selected wallet identifier
      />
    </>
  );
};

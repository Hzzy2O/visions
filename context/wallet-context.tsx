"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type WalletContextType = {
  connected: boolean
  address: string | null
  connect: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  const connect = () => {
    // Simulate wallet connection
    setConnected(true)
    setAddress("0x1234...5678")
  }

  const disconnect = () => {
    setConnected(false)
    setAddress(null)
  }

  return <WalletContext.Provider value={{ connected, address, connect, disconnect }}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

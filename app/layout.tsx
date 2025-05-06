import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import { WalletProvider } from "@/context/wallet-context"
import { ProfileProvider } from "@/context/profile-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Web3 Content Platform",
  description: "Share your creative visual content",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <ProfileProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
          </ProfileProvider>
        </WalletProvider>
      </body>
    </html>
  )
}

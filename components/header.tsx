"use client";

import Link from "next/link";
import { Home, User, Upload, Menu, X } from "lucide-react";
import { useState } from "react";
import { Connector } from "./ui/Connector";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black uppercase tracking-tighter text-blue">
            VISIONS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          <Link
            href="/"
            className="flex items-center gap-1 font-medium hover:text-blue"
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-1 font-medium hover:text-blue"
          >
            <User size={18} />
            <span>Profile</span>
          </Link>
          <Link
            href="/publish"
            className="flex items-center gap-1 font-medium hover:text-blue"
          >
            <Upload size={18} />
            <span>Publish</span>
          </Link>
        </nav>

        {/* Wallet Connection */}
        <div className="hidden md:block">
          <Connector />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="container pb-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User size={18} />
              <span>Profile</span>
            </Link>
            <Link
              href="/publish"
              className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Upload size={18} />
              <span>Publish</span>
            </Link>
            <div className="pt-2">
              <Connector />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

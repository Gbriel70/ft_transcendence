"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { User, LogOut } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#0b1a30] shadow-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/images/minibank-logo.png"
            alt="MiniBank Logo"
            width={140}
            height={36}
            className="h-8 w-auto brightness-0 invert"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-white/70 sm:inline">
            felippealencar@gmail.com
          </span>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-white/70 hover:text-red-300 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

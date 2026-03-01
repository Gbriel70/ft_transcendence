"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
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
          <span className="hidden text-sm text-muted-foreground sm:inline">
            felippealencar@gmail.com
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

"use client"

import { Wallet, TrendingUp, TrendingDown } from "lucide-react"

export function BalanceCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-6">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4 text-primary" />
          <span>Current Balance</span>
        </div>

        <p className="mt-3 text-4xl font-bold tracking-tight text-foreground font-mono">
          R$ 12,450.00
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="font-medium">+R$ 3,200</span>
            </div>
            <span className="text-muted-foreground">income</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-rose-400">
              <TrendingDown className="h-3.5 w-3.5" />
              <span className="font-medium">-R$ 1,580</span>
            </div>
            <span className="text-muted-foreground">expenses</span>
          </div>
        </div>
      </div>
    </div>
  )
}

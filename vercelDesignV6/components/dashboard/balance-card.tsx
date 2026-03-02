"use client"

import { Wallet, TrendingUp, TrendingDown } from "lucide-react"

export function BalanceCard() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0b1a30] via-[#0f2a4a] to-[#0c7c80] p-6 shadow-lg">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-[#17b5ba]/20 blur-2xl" />
      <div className="pointer-events-none absolute right-8 bottom-4 h-16 w-16 rounded-full border border-white/10" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Wallet className="h-4 w-4 text-[#17b5ba]" />
          <span>Current Balance</span>
        </div>

        <p className="mt-3 text-4xl font-bold tracking-tight text-white font-mono">
          R$ 12,450.00
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <div className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="font-medium">+R$ 3,200</span>
            </div>
            <span className="text-white/50">income</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className="flex items-center gap-1 rounded-full bg-rose-400/20 px-2.5 py-1 text-rose-300">
              <TrendingDown className="h-3.5 w-3.5" />
              <span className="font-medium">-R$ 1,580</span>
            </div>
            <span className="text-white/50">expenses</span>
          </div>
        </div>
      </div>
    </div>
  )
}

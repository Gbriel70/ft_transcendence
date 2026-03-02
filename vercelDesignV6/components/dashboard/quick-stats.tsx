"use client"

import { ArrowUpRight, ArrowDownLeft, Repeat, Users } from "lucide-react"

const stats = [
  {
    label: "Total Received",
    value: "R$ 3,200.00",
    icon: ArrowDownLeft,
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
  },
  {
    label: "Total Sent",
    value: "R$ 1,580.00",
    icon: ArrowUpRight,
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-500/15",
  },
  {
    label: "Transactions",
    value: "23",
    icon: Repeat,
    color: "text-[#0c7c80] dark:text-[#17b5ba]",
    bg: "bg-[#0c7c80]/10 dark:bg-[#17b5ba]/15",
  },
  {
    label: "Contacts",
    value: "12",
    icon: Users,
    color: "text-[#1777a8] dark:text-[#1e9bd7]",
    bg: "bg-[#1777a8]/10 dark:bg-[#1e9bd7]/15",
  },
]

export function QuickStats() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-[#0c7c80]/60 hover:bg-[#eef3fa] hover:shadow-md dark:hover:border-[#17b5ba]/50 dark:hover:bg-[#122848]"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-card-foreground font-mono">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

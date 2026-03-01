"use client"

import { ArrowUpRight, ArrowDownLeft, Repeat, Users } from "lucide-react"

const stats = [
  {
    label: "Total Received",
    value: "R$ 3,200.00",
    icon: ArrowDownLeft,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
  },
  {
    label: "Total Sent",
    value: "R$ 1,580.00",
    icon: ArrowUpRight,
    color: "text-rose-400",
    bg: "bg-rose-500/15",
  },
  {
    label: "Transactions",
    value: "23",
    icon: Repeat,
    color: "text-primary",
    bg: "bg-primary/15",
  },
  {
    label: "Contacts",
    value: "12",
    icon: Users,
    color: "text-accent",
    bg: "bg-accent/15",
  },
]

export function QuickStats() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-foreground font-mono">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

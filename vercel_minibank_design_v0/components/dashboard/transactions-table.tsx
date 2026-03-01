"use client"

import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const transactions = [
  {
    id: 1,
    date: "2026-02-27",
    description: "Payment from Maria Silva",
    amount: "+R$ 1,200.00",
    type: "income" as const,
    status: "completed" as const,
  },
  {
    id: 2,
    date: "2026-02-26",
    description: "Transfer to João Santos",
    amount: "-R$ 350.00",
    type: "expense" as const,
    status: "completed" as const,
  },
  {
    id: 3,
    date: "2026-02-25",
    description: "Payment from Lucas Oliveira",
    amount: "+R$ 2,000.00",
    type: "income" as const,
    status: "completed" as const,
  },
  {
    id: 4,
    date: "2026-02-24",
    description: "Transfer to Ana Costa",
    amount: "-R$ 780.00",
    type: "expense" as const,
    status: "pending" as const,
  },
  {
    id: 5,
    date: "2026-02-23",
    description: "Transfer to Pedro Lima",
    amount: "-R$ 450.00",
    type: "expense" as const,
    status: "failed" as const,
  },
]

function StatusBadge({ status }: { status: "completed" | "pending" | "failed" }) {
  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      >
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </Badge>
    )
  }
  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400"
      >
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-rose-500/30 bg-rose-500/10 text-rose-400"
    >
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  )
}

export function TransactionsTable() {
  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Recent Transactions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your latest financial activity
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-border/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="transition-colors hover:bg-secondary/30"
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground font-mono">
                  {tx.date}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        tx.type === "income"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {tx.type === "income" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {tx.description}
                    </span>
                  </div>
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold font-mono ${
                    tx.type === "income"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {tx.amount}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <StatusBadge status={tx.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

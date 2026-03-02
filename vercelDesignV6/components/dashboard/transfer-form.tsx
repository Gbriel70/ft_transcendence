"use client"

import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TransferForm() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-[#0c7c80]/50 hover:shadow-md dark:hover:border-[#17b5ba]/40">
      <h2 className="text-lg font-semibold text-card-foreground">Transfer Money</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Send money to anyone instantly
      </p>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-card-foreground">
            Recipient Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            className="border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-card-foreground">
            Amount (R$)
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            className="border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary font-mono"
          />
        </div>

        <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md shadow-primary/20">
          <Send className="h-4 w-4" />
          Send Money
        </Button>
      </div>
    </div>
  )
}

"use client"

import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TransferForm() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">Transfer Money</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Send money to anyone instantly
      </p>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            Recipient Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            className="border-border/50 bg-secondary/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm text-muted-foreground">
            Amount (R$)
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            className="border-border/50 bg-secondary/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary font-mono"
          />
        </div>

        <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Send className="h-4 w-4" />
          Send Money
        </Button>
      </div>
    </div>
  )
}

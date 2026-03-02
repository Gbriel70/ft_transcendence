import { Navbar } from "@/components/dashboard/navbar"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { TransferForm } from "@/components/dashboard/transfer-form"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { QuickStats } from "@/components/dashboard/quick-stats"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-[#0c7c80]/5 dark:bg-[#17b5ba]/5 blur-[150px]" />
        <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-[#1777a8]/5 dark:bg-[#1e9bd7]/5 blur-[120px]" />
      </div>

      <div className="relative">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="space-y-6">
            {/* Balance + Transfer Section */}
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <BalanceCard />
              </div>
              <div className="lg:col-span-2">
                <TransferForm />
              </div>
            </div>

            {/* Quick Stats */}
            <QuickStats />

            {/* Transactions */}
            <TransactionsTable />
          </div>
        </main>
      </div>
    </div>
  )
}

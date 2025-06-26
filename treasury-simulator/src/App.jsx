"use client"

import { useState, useEffect, useMemo } from "react"
import {
  ArrowRightLeft,
  Plus,
  Download,
  TrendingUp,
  Wallet,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

const TreasurySimulator = () => {
  // Static FX rates (real-world would be dynamic)
  const FX_RATES = {
    "KES-USD": 0.0067,
    "USD-KES": 149.25,
    "KES-NGN": 2.58,
    "NGN-KES": 0.387,
    "USD-NGN": 385.5,
    "NGN-USD": 0.0026,
  }

  
  const getFXRate = (fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return 1

    // Direct rate
    const directRate = FX_RATES[`${fromCurrency}-${toCurrency}`]
    if (directRate) return directRate

    // Inverse rate
    const inverseRate = FX_RATES[`${toCurrency}-${fromCurrency}`]
    if (inverseRate) return 1 / inverseRate

    // Cross rate via USD (fallback)
    const fromToUSD = FX_RATES[`${fromCurrency}-USD`]
    const USDToTo = FX_RATES[`USD-${toCurrency}`]
    if (fromToUSD && USDToTo) return fromToUSD * USDToTo

    console.warn(`No FX rate found for ${fromCurrency} to ${toCurrency}`)
    return 1
  }

  // Initialize 10 virtual accounts
  const [accounts, setAccounts] = useState([
    { id: 1, name: "Mpesa_KES_1", currency: "KES", balance: 2500000.5, type: "Mobile Money" },
    { id: 2, name: "Bank_USD_1", currency: "USD", balance: 15000.75, type: "Bank Account" },
    { id: 3, name: "Equity_KES_2", currency: "KES", balance: 890000.25, type: "Bank Account" },
    { id: 4, name: "Chase_USD_2", currency: "USD", balance: 8500.0, type: "Bank Account" },
    { id: 5, name: "GTBank_NGN_1", currency: "NGN", balance: 12500000.0, type: "Bank Account" },
    { id: 6, name: "Safaricom_KES_3", currency: "KES", balance: 450000.8, type: "Mobile Money" },
    { id: 7, name: "Wells_USD_3", currency: "USD", balance: 22000.3, type: "Bank Account" },
    { id: 8, name: "Zenith_NGN_2", currency: "NGN", balance: 8750000.5, type: "Bank Account" },
    { id: 9, name: "ABSA_KES_4", currency: "KES", balance: 1200000.0, type: "Bank Account" },
    { id: 10, name: "Access_NGN_3", currency: "NGN", balance: 5500000.75, type: "Bank Account" },
  ])

  const [transactions, setTransactions] = useState([])
  const [transferForm, setTransferForm] = useState({
    fromAccount: "",
    toAccount: "",
    amount: "",
    note: "",
    scheduleDate: "",
    isScheduled: false,
  })

  const [filters, setFilters] = useState({
    account: "",
    currency: "",
    dateFrom: "",
    dateTo: "",
  })

  const [showTransferModal, setShowTransferModal] = useState(false)
  const [notification, setNotification] = useState(null)
  const [isTransferring, setIsTransferring] = useState(false)

  
  useEffect(() => {
    const savedAccounts = localStorage.getItem("treasury-accounts")
    const savedTransactions = localStorage.getItem("treasury-transactions")

    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts))
    }
    if (savedTransactions) {
      setTransactions(
        JSON.parse(savedTransactions, (key, value) => {
          if (key === "timestamp") return new Date(value)
          return value
        }),
      )
    }
  }, [])

  // Add this useEffect to save data when it changes:
  useEffect(() => {
    localStorage.setItem("treasury-accounts", JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    localStorage.setItem("treasury-transactions", JSON.stringify(transactions))
  }, [transactions])

  // Calculate totals by currency
  const portfolioSummary = useMemo(() => {
    const summary = { KES: 0, USD: 0, NGN: 0 }
    accounts.forEach((account) => {
      summary[account.currency] += account.balance
    })
    return summary
  }, [accounts])

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000) // Increased timeout for error messages
  }

  // Format currency
  const formatCurrency = (amount, currency) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "KES" ? "KES" : currency === "NGN" ? "NGN" : "USD",
      minimumFractionDigits: 2,
    })
    return formatter.format(amount)
  }

  // Format currency inputs as user types:
  const formatAmountInput = (value) => {
    const numericValue = value.replace(/[^\d.]/g, "")
    const parts = numericValue.split(".")
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("")
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + "." + parts[1].substring(0, 2)
    }
    return numericValue
  }

  // Handle transfer
  const handleTransfer = () => {
    const { fromAccount: fromId, toAccount: toId, amount, note, scheduleDate, isScheduled } = transferForm

    // Enhanced validation
    const errors = []
    if (!fromId) errors.push("Please select a source account")
    if (!toId) errors.push("Please select a destination account")
    if (!amount || isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      errors.push("Please enter a valid amount greater than 0")
    }
    if (isScheduled && !scheduleDate) errors.push("Please select a schedule date")
    if (isScheduled && new Date(scheduleDate) <= new Date()) {
      errors.push("Schedule date must be in the future")
    }

    if (errors.length > 0) {
      showNotification(errors.join(". "), "error")
      return
    }

    setIsTransferring(true)

    const fromAccount = accounts.find((acc) => acc.id === Number.parseInt(fromId))
    const toAccount = accounts.find((acc) => acc.id === Number.parseInt(toId))
    const transferAmount = Number.parseFloat(amount)

    if (fromAccount.balance < transferAmount) {
      showNotification("Insufficient balance in source account", "error")
      setIsTransferring(false)
      return
    }

    if (fromId === toId) {
      showNotification("Cannot transfer to the same account", "error")
      setIsTransferring(false)
      return
    }

    // Calculate FX conversion
    const fxRate = getFXRate(fromAccount.currency, toAccount.currency)
    const convertedAmount = transferAmount * fxRate

    // Create transaction record
    const transaction = {
      id: Date.now(),
      fromAccount: fromAccount.name,
      toAccount: toAccount.name,
      fromCurrency: fromAccount.currency,
      toCurrency: toAccount.currency,
      amount: transferAmount,
      convertedAmount: convertedAmount,
      fxRate: fxRate,
      note: note || "",
      timestamp: isScheduled ? new Date(scheduleDate) : new Date(),
      status: isScheduled ? "Scheduled" : "Completed",
      isScheduled: isScheduled,
    }

    // Update balances (only if not scheduled)
    if (!isScheduled) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === Number.parseInt(fromId)) {
            return { ...acc, balance: acc.balance - transferAmount }
          }
          if (acc.id === Number.parseInt(toId)) {
            return { ...acc, balance: acc.balance + convertedAmount }
          }
          return acc
        }),
      )
    }

    // Add transaction to log
    setTransactions((prev) => [transaction, ...prev])

    // Reset form and close modal
    setTransferForm({
      fromAccount: "",
      toAccount: "",
      amount: "",
      note: "",
      scheduleDate: "",
      isScheduled: false,
    })
    setShowTransferModal(false)

    const message = isScheduled
      ? `Transfer scheduled for ${new Date(scheduleDate).toLocaleDateString()}`
      : `Transfer completed: ${formatCurrency(transferAmount, fromAccount.currency)} → ${formatCurrency(convertedAmount, toAccount.currency)}`

    showNotification(message)
    setIsTransferring(false)
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (filters.account && !txn.fromAccount.includes(filters.account) && !txn.toAccount.includes(filters.account)) {
        return false
      }
      if (filters.currency && txn.fromCurrency !== filters.currency && txn.toCurrency !== filters.currency) {
        return false
      }
      if (filters.dateFrom && new Date(txn.timestamp) < new Date(filters.dateFrom)) {
        return false
      }
      if (filters.dateTo && new Date(txn.timestamp) > new Date(filters.dateTo)) {
        return false
      }
      return true
    })
  }, [transactions, filters])

  // Export transactions
  const exportTransactions = () => {
    const csvContent = [
      [
        "Timestamp",
        "From Account",
        "To Account",
        "Amount",
        "From Currency",
        "To Currency",
        "Converted Amount",
        "FX Rate",
        "Note",
        "Status",
      ],
      ...filteredTransactions.map((txn) => [
        txn.timestamp.toISOString(),
        txn.fromAccount,
        txn.toAccount,
        txn.amount,
        txn.fromCurrency,
        txn.toCurrency,
        txn.convertedAmount,
        txn.fxRate,
        txn.note,
        txn.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "treasury_transactions.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Notification - Fixed positioning with higher z-index */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md ${
            notification.type === "success" 
              ? "bg-green-600 border border-green-500" 
              : "bg-red-600 border border-red-500"
          } text-white animate-slide-in backdrop-blur-sm`}
          style={{
            boxShadow: notification.type === "error" 
              ? "0 20px 25px -5px rgba(239, 68, 68, 0.3), 0 10px 10px -5px rgba(239, 68, 68, 0.2)" 
              : "0 20px 25px -5px rgba(34, 197, 94, 0.3), 0 10px 10px -5px rgba(34, 197, 94, 0.2)"
          }}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium leading-relaxed">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-white/80 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Treasury Movement Simulator
          </h1>
          <p className="text-slate-300">Multi-currency treasury operations and fund movements</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(portfolioSummary).map(([currency, total]) => (
            <div key={currency} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">Total {currency}</span>
                </div>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(total, currency)}</div>
            </div>
          ))}
        </div>

        {/* Accounts Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-400" />
              Virtual Accounts
            </h2>
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              New Transfer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{account.name}</h3>
                    <p className="text-slate-400 text-sm">{account.type}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      account.currency === "KES"
                        ? "bg-green-500/20 text-green-400"
                        : account.currency === "USD"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-purple-500/20 text-purple-400"
                    }`}
                  >
                    {account.currency}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-2">{formatCurrency(account.balance, account.currency)}</div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min((account.balance / Math.max(...accounts.map((a) => a.balance))) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Log */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 text-blue-400" />
              Transaction History
            </h2>

            <div className="flex flex-wrap gap-2">
              <select
                value={filters.account}
                onChange={(e) => setFilters((prev) => ({ ...prev, account: e.target.value }))}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.currency}
                onChange={(e) => setFilters((prev) => ({ ...prev, currency: e.target.value }))}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Currencies</option>
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="NGN">NGN</option>
              </select>

              <button
                onClick={exportTransactions}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No transactions yet. Start by creating your first transfer!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-2">Timestamp</th>
                    <th className="text-left py-3 px-2">From → To</th>
                    <th className="text-left py-3 px-2">Amount</th>
                    <th className="text-left py-3 px-2">FX Rate</th>
                    <th className="text-left py-3 px-2">Note</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-sm">{txn.timestamp.toLocaleDateString()}</div>
                            <div className="text-xs text-slate-400">{txn.timestamp.toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{txn.fromAccount}</span>
                          <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                          <span className="text-sm">{txn.toAccount}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <div className="font-medium">{formatCurrency(txn.amount, txn.fromCurrency)}</div>
                          {txn.fromCurrency !== txn.toCurrency && (
                            <div className="text-xs text-slate-400">
                              → {formatCurrency(txn.convertedAmount, txn.toCurrency)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        {txn.fromCurrency !== txn.toCurrency ? (
                          <span className="text-sm text-slate-300">{txn.fxRate.toFixed(4)}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-sm text-slate-300">{txn.note || "-"}</span>
                      </td>
                      <td className="py-4 px-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            txn.status === "Completed"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal - Reduced z-index to be below notification */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9998]">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Create Transfer</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">From Account</label>
                <select
                  value={transferForm.fromAccount}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, fromAccount: e.target.value }))}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select source account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - {formatCurrency(acc.balance, acc.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">To Account</label>
                <select
                  value={transferForm.toAccount}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, toAccount: e.target.value }))}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select destination account</option>
                  {accounts
                    .filter((acc) => acc.id !== Number.parseInt(transferForm.fromAccount))
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} - {acc.currency}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={transferForm.amount}
                  onChange={(e) =>
                    setTransferForm((prev) => ({
                      ...prev,
                      amount: formatAmountInput(e.target.value),
                    }))
                  }
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
                {transferForm.fromAccount && transferForm.toAccount && transferForm.amount && (
                  <div className="mt-2 p-2 bg-blue-500/20 rounded text-sm">
                    {(() => {
                      const fromAcc = accounts.find((a) => a.id === Number.parseInt(transferForm.fromAccount))
                      const toAcc = accounts.find((a) => a.id === Number.parseInt(transferForm.toAccount))
                      const amount = Number.parseFloat(transferForm.amount)
                      const rate = getFXRate(fromAcc?.currency, toAcc?.currency)
                      const converted = amount * rate

                      if (fromAcc?.currency !== toAcc?.currency) {
                        return `Will convert: ${formatCurrency(amount, fromAcc.currency)} → ${formatCurrency(converted, toAcc.currency)} (Rate: ${rate.toFixed(4)})`
                      }
                      return `Transfer amount: ${formatCurrency(amount, fromAcc.currency)}`
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Note (Optional)</label>
                <input
                  type="text"
                  value={transferForm.note}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, note: e.target.value }))}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transfer description"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="schedule"
                  checked={transferForm.isScheduled}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, isScheduled: e.target.checked }))}
                  className="rounded border-white/30"
                />
                <label htmlFor="schedule" className="text-sm">
                  Schedule for future date
                </label>
              </div>

              {transferForm.isScheduled && (
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule Date</label>
                  <input
                    type="datetime-local"
                    value={transferForm.scheduleDate}
                    onChange={(e) => setTransferForm((prev) => ({ ...prev, scheduleDate: e.target.value }))}
                    className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={isTransferring}
                aria-label={transferForm.isScheduled ? "Schedule Transfer" : "Execute Transfer"}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransferring ? "Processing..." : transferForm.isScheduled ? "Schedule Transfer" : "Execute Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

       <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
                        opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
       
        .notification-container {
          pointer-events: auto;
        }
        
        /* Add pulse animation for error notifications */
        @keyframes pulse-error {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }
        
        .error-notification {
          animation: slide-in 0.3s ease-out, pulse-error 2s infinite;
        }
      `}</style>
    </div>
  )
}

export default TreasurySimulator




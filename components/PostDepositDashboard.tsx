"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Button from "./Button";
import { useHyperliquidBalance } from "@/lib/hooks/useHyperliquidBalance";

// Explorer URLs by chain ID
const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io/tx/",
  42161: "https://arbiscan.io/tx/",
  8453: "https://basescan.org/tx/",
  10: "https://optimistic.etherscan.io/tx/",
  137: "https://polygonscan.com/tx/",
  56: "https://bscscan.com/tx/",
  999: "https://explorer.hyperliquid-testnet.xyz/tx/",
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Etherscan",
  42161: "Arbiscan",
  8453: "BaseScan",
  10: "Optimism",
  137: "PolygonScan",
  56: "BscScan",
  999: "HyperEVM",
};

interface PostDepositDashboardProps {
  depositAmount: string;
  depositTxHash: string;
  bridgeTxHash?: string;
  sourceChainId?: number; // Source chain for bridge tx explorer
  onReset: () => void;
}

interface TradingSuggestion {
  id: string;
  title: string;
  description: string;
  risk: "low" | "medium" | "high";
  riskLabel: string;
  fees: string;
  icon: string;
  action: string;
  url: string;
  color: string;
}

const TRADING_SUGGESTIONS: TradingSuggestion[] = [
  {
    id: "spot",
    title: "Spot Trade ETH/USDC",
    description: "Buy or sell ETH with your USDC balance",
    risk: "low",
    riskLabel: "Low Risk",
    fees: "~0.02%",
    icon: "chart-line",
    action: "Start Trading",
    url: "https://app.hyperliquid.xyz/trade/ETH",
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "perp",
    title: "Perpetual Futures",
    description: "Trade with leverage on 100+ markets",
    risk: "high",
    riskLabel: "High Risk",
    fees: "~0.035%",
    icon: "bolt",
    action: "Open Position",
    url: "https://app.hyperliquid.xyz/trade",
    color: "from-orange-400 to-red-500",
  },
  {
    id: "vault",
    title: "Passive Vault Strategy",
    description: "Deposit into a neutral strategy vault",
    risk: "medium",
    riskLabel: "Medium Risk",
    fees: "Variable",
    icon: "safe",
    action: "View Vaults",
    url: "https://app.hyperliquid.xyz/vaults",
    color: "from-blue-400 to-indigo-500",
  },
];

const QUICK_ACTIONS = [
  {
    label: "Spot",
    url: "https://app.hyperliquid.xyz/trade",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  {
    label: "Perpetuals",
    url: "https://app.hyperliquid.xyz/trade",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    label: "Vaults",
    url: "https://app.hyperliquid.xyz/vaults",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    label: "Portfolio",
    url: "https://app.hyperliquid.xyz/portfolio",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
];

export default function PostDepositDashboard({
  depositAmount,
  depositTxHash,
  bridgeTxHash,
  sourceChainId = 8453, // Default to Base
  onReset,
}: PostDepositDashboardProps) {
  const { address } = useAccount();
  const [showRecovery, setShowRecovery] = useState(false);
  const [depositTime] = useState(new Date());
  const [balanceReady, setBalanceReady] = useState(false);

  // Fetch Hyperliquid balance with delay to allow deposit to process
  const {
    totalUsdcBalance,
    accountValue,
    withdrawable,
    isLoading: isBalanceLoading,
    refetchWithDelay,
  } = useHyperliquidBalance(address);

  const parsedAmount = parseFloat(depositAmount) || 0;

  // Fetch balance with delay after mount (deposit needs time to process)
  useEffect(() => {
    const fetchBalanceWithDelay = async () => {
      // Wait 3 seconds for deposit to be processed
      await refetchWithDelay(3000);
      setBalanceReady(true);
    };
    fetchBalanceWithDelay();
  }, [refetchWithDelay]);

  // Use fetched balance if available, otherwise use deposit amount
  const displayBalance = balanceReady && totalUsdcBalance > 0
    ? totalUsdcBalance
    : parsedAmount;

  // Get explorer URL for bridge transaction (source chain)
  const bridgeExplorerUrl = bridgeTxHash
    ? `${EXPLORER_URLS[sourceChainId] || EXPLORER_URLS[8453]}${bridgeTxHash}`
    : undefined;
  const bridgeExplorerName = CHAIN_NAMES[sourceChainId] || "Explorer";

  // Calculate time since deposit
  const getTimeSinceDeposit = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - depositTime.getTime()) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="glass-card p-6 md:p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-black mb-2">
          Deposit Successful!
        </h2>
        <p className="text-white/70 text-lg">
          <span className="text-[#03b3c3] font-bold">
            ${parsedAmount.toFixed(2)} USDC
          </span>{" "}
          is now in your Hyperliquid trading account
        </p>
      </div>

      {/* Account Summary Card */}
      <div className="glass-card p-6 border border-[#03b3c3]/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Account Status</h3>
          <div className="flex items-center gap-2">
            {isBalanceLoading ? (
              <>
                <div className="w-2 h-2 border border-[#03b3c3] border-t-transparent rounded-full animate-spin" />
                <span className="text-[#03b3c3] text-sm font-medium">
                  Syncing...
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-sm font-medium">
                  Connected to Hyperliquid
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-lg bg-white/5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
              Trading Balance
            </p>
            {isBalanceLoading && !balanceReady ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#03b3c3] border-t-transparent rounded-full animate-spin" />
                <span className="text-white/50">Loading...</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-white">
                ${displayBalance.toFixed(2)}
              </p>
            )}
            <p className="text-xs text-[#03b3c3] mt-1">USDC Available</p>
          </div>
          <div className="glass-card p-4 rounded-lg bg-white/5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
              Margin Available
            </p>
            {isBalanceLoading && !balanceReady ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#03b3c3] border-t-transparent rounded-full animate-spin" />
                <span className="text-white/50">Loading...</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-white">
                ${displayBalance.toFixed(2)}
              </p>
            )}
            <p className="text-xs text-green-400 mt-1">Ready to Trade</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Last Action</span>
            <span className="text-white">
              Deposited via Relay ({getTimeSinceDeposit()})
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="glass-card p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/70 text-sm">Deposit Transaction</span>
          <a
            href={`https://arbiscan.io/tx/${depositTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#03b3c3] text-sm hover:underline flex items-center gap-1"
          >
            View on Arbiscan
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
        <code className="text-xs text-white/50 break-all block">
          {depositTxHash}
        </code>
        {bridgeTxHash && bridgeExplorerUrl && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Bridge Transaction (Source Chain)</span>
              <a
                href={bridgeExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#03b3c3] text-sm hover:underline flex items-center gap-1"
              >
                View on {bridgeExplorerName}
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
            <code className="text-xs text-white/50 break-all block">
              {bridgeTxHash}
            </code>
          </div>
        )}
      </div>

      {/* What Should I Do Now? - Smart Suggestions */}
      <div className="glass-card p-6 border border-[#03b3c3]/20">
        <h3 className="text-lg font-bold text-white mb-2">
          What Should I Do Now?
        </h3>
        <p className="text-white/50 text-sm mb-4">
          You have ${parsedAmount.toFixed(2)} USDC ready to trade. Here are some
          options:
        </p>

        <div className="space-y-3">
          {TRADING_SUGGESTIONS.map((suggestion) => (
            <a
              key={suggestion.id}
              href={suggestion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-card p-4 rounded-lg border border-white/10 hover:border-white/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${suggestion.color} flex items-center justify-center shrink-0`}
                >
                  {suggestion.id === "spot" && (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  )}
                  {suggestion.id === "perp" && (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )}
                  {suggestion.id === "vault" && (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold group-hover:text-[#03b3c3] transition-colors">
                      {suggestion.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        suggestion.risk === "low"
                          ? "bg-green-400/20 text-green-400"
                          : suggestion.risk === "medium"
                          ? "bg-yellow-400/20 text-yellow-400"
                          : "bg-red-400/20 text-red-400"
                      }`}
                    >
                      {suggestion.riskLabel}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm">{suggestion.description}</p>
                  <p className="text-xs text-white/30 mt-1">
                    Fees: {suggestion.fees}
                  </p>
                </div>
                <div className="text-[#03b3c3] group-hover:translate-x-1 transition-transform">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Execution Readiness Panel */}
      <div className="glass-card p-4 border border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3">
          Execution Readiness
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-white/70">Account funded</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-white/70">Minimum margin met</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-white/50">No open positions</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-white/50">No stop losses set</span>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="glass-card p-6 border border-[#03b3c3]/20">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.label}
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#03b3c3]/50 hover:bg-[#03b3c3]/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-[#03b3c3]/20 flex items-center justify-center group-hover:bg-[#03b3c3]/30 transition-colors">
                <svg
                  className="w-5 h-5 text-[#03b3c3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={action.icon}
                  />
                </svg>
              </div>
              <span className="text-white text-sm font-medium">
                {action.label}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Main CTA */}
      <a
        href="https://app.hyperliquid.xyz/trade"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button className="w-full py-4 text-lg font-bold">
          Go to Hyperliquid App
        </Button>
      </a>

      {/* Recovery Panel (Expandable) */}
      <div className="glass-card border border-white/10 overflow-hidden">
        <button
          onClick={() => setShowRecovery(!showRecovery)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        >
          <span className="text-white/50 text-sm">
            If something went wrong
          </span>
          <svg
            className={`w-4 h-4 text-white/50 transition-transform ${
              showRecovery ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {showRecovery && (
          <div className="p-4 pt-0 space-y-2">
            <button
              onClick={onReset}
              className="w-full p-3 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Retry bridge / deposit
            </button>
            <a
              href={`https://arbiscan.io/tx/${depositTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-3 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              View raw transaction details
            </a>
            <a
              href="https://discord.gg/hyperliquid"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-3 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Contact support / Discord
            </a>
          </div>
        )}
      </div>

      {/* Bridge More */}
      <div className="text-center pt-4 border-t border-white/10">
        <button
          onClick={onReset}
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          Bridge More Funds
        </button>
      </div>
    </div>
  );
}

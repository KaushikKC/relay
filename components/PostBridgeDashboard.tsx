"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import Button from "./Button";
import {
  POPULAR_PAIRS,
  getBeginnerPairSuggestion,
  executePairTrade,
  estimatePairTradeFees,
  type PairTradeParams,
  type PairTradeResponse,
} from "@/lib/utils/pear-api";
import { CHAIN_IDS } from "@/lib/config/lifi";

interface PostBridgeDashboardProps {
  amount: string;
  token: string;
  txHash?: string;
  onDepositClick: () => void;
  onReset: () => void;
}

type DashboardView =
  | "overview"
  | "pair-trade-setup"
  | "pair-trade-executing"
  | "pair-trade-success";

type PairType = (typeof POPULAR_PAIRS)[number];

const EXPLORE_LINKS = [
  {
    title: "Spot Trading",
    description: "Trade on Hyperliquid",
    url: "https://app.hyperliquid.xyz/trade",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  {
    title: "Perpetuals",
    description: "Leverage trading",
    url: "https://app.hyperliquid.xyz/trade",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    title: "Vaults",
    description: "Passive earning",
    url: "https://app.hyperliquid.xyz/vaults",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    title: "Portfolio",
    description: "View positions",
    url: "https://app.hyperliquid.xyz/portfolio",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
];

const BUILDER_ACTIONS = [
  {
    title: "Deploy Contract",
    description: "Deploy your first smart contract on HyperEVM",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    url: "https://docs.hyperliquid.xyz/hyperevm",
    color: "from-purple-400 to-indigo-500",
  },
  {
    title: "Provide Liquidity",
    description: "Add liquidity to DEX pools on HyperEVM",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    url: "#",
    color: "from-cyan-400 to-blue-500",
  },
  {
    title: "Bridge Again",
    description: "Top up your HyperEVM balance",
    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    url: "#",
    color: "from-green-400 to-emerald-500",
    isReset: true,
  },
];

export default function PostBridgeDashboard({
  amount,
  token,
  txHash,
  onDepositClick,
  onReset,
}: PostBridgeDashboardProps) {
  const { address } = useAccount();
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [selectedPair, setSelectedPair] = useState<PairType>(POPULAR_PAIRS[0]);
  const [tradeDirection, setTradeDirection] = useState<
    "long-short" | "short-long"
  >("long-short");
  const [tradeAmount, setTradeAmount] = useState<number>(20);
  const [tradeResult, setTradeResult] = useState<PairTradeResponse | null>(
    null
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [bridgeTime] = useState(new Date());

  // Get HyperEVM balance
  const { data: ethBalance, isLoading: isEthLoading } = useBalance({
    address,
    chainId: CHAIN_IDS.HYPEREVM,
  });

  const { data: usdcBalance, isLoading: isUsdcLoading } = useBalance({
    address,
    chainId: CHAIN_IDS.HYPEREVM,
    // USDC on HyperEVM - you'd need the actual address
  });

  const parsedAmount = parseFloat(amount) || 0;
  const suggestion = getBeginnerPairSuggestion(parsedAmount);
  const hasLowGas =
    ethBalance && parseFloat(ethBalance.formatted) < 0.0001;

  const getTimeSinceBridge = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - bridgeTime.getTime()) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  const handleQuickPairTrade = () => {
    setSelectedPair(suggestion.pair as PairType);
    setTradeAmount(suggestion.params.amount);
    setTradeDirection(suggestion.params.direction);
    setCurrentView("pair-trade-setup");
  };

  const handleExecutePairTrade = async () => {
    setIsExecuting(true);
    setCurrentView("pair-trade-executing");

    try {
      const params: PairTradeParams = {
        pair: selectedPair.id,
        asset1: selectedPair.asset1,
        asset2: selectedPair.asset2,
        amount: tradeAmount,
        direction: tradeDirection,
        leverage: 1,
      };

      const result = await executePairTrade(params);
      setTradeResult(result);

      if (result.success) {
        setCurrentView("pair-trade-success");
      } else {
        setCurrentView("pair-trade-setup");
        alert(result.message || "Trade failed");
      }
    } catch (error) {
      console.error("Error executing pair trade:", error);
      alert("Failed to execute pair trade");
      setCurrentView("pair-trade-setup");
    } finally {
      setIsExecuting(false);
    }
  };

  const fees = estimatePairTradeFees(tradeAmount);

  // Render pair trade success
  if (currentView === "pair-trade-success" && tradeResult?.success) {
    return (
      <div className="glass-card p-8 md:p-12 space-y-6 mobile-padding">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto animate-bounce">
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

          <h2 className="text-3xl md:text-4xl font-heading font-black mobile-text-3xl">
            Pair Trade Opened!
          </h2>
          <p className="text-white/70 text-lg mobile-text-lg">
            Your first pair trade is now live on Hyperliquid via Pear Protocol
          </p>

          <div className="glass-card p-6 rounded-lg border border-[#03b3c3]/30 mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Trade ID:</span>
              <code className="text-[#03b3c3] text-sm">
                {tradeResult.tradeId}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Pair:</span>
              <span className="text-white font-semibold">
                {selectedPair.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Direction:</span>
              <span className="text-white font-semibold">
                {tradeDirection === "long-short"
                  ? `Long ${selectedPair.asset1} / Short ${selectedPair.asset2}`
                  : `Short ${selectedPair.asset1} / Long ${selectedPair.asset2}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Amount:</span>
              <span className="text-white font-semibold">
                ${tradeAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {tradeResult.asset1Position && tradeResult.asset2Position && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="glass-card p-4 rounded-lg border border-green-400/30 bg-green-400/5">
                <div className="text-sm text-white/50 mb-2">
                  {tradeResult.asset1Position.side === "long" ? "Long" : "Short"}
                </div>
                <div className="text-2xl font-bold text-white">
                  {tradeResult.asset1Position.asset}
                </div>
                <div className="text-sm text-white/70 mt-2">
                  Size: {tradeResult.asset1Position.size.toFixed(4)}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Entry: ${tradeResult.asset1Position.entryPrice.toFixed(2)}
                </div>
              </div>

              <div className="glass-card p-4 rounded-lg border border-red-400/30 bg-red-400/5">
                <div className="text-sm text-white/50 mb-2">
                  {tradeResult.asset2Position.side === "long" ? "Long" : "Short"}
                </div>
                <div className="text-2xl font-bold text-white">
                  {tradeResult.asset2Position.asset}
                </div>
                <div className="text-sm text-white/70 mt-2">
                  Size: {tradeResult.asset2Position.size.toFixed(4)}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Entry: ${tradeResult.asset2Position.entryPrice.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 mt-8">
            <a
              href="https://www.pear.garden"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full mobile-btn">
                Manage Position on Pear Protocol
              </Button>
            </a>
            <button
              onClick={() => setCurrentView("overview")}
              className="w-full px-6 py-3 text-white/70 hover:text-white transition-colors mobile-btn"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render pair trade executing
  if (currentView === "pair-trade-executing") {
    return (
      <div className="glass-card p-8 md:p-12 space-y-6 mobile-padding">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full border-4 border-[#03b3c3]/20 border-t-[#03b3c3] flex items-center justify-center mx-auto animate-spin" />
          <h2 className="text-3xl md:text-4xl font-heading font-black mobile-text-3xl">
            Executing Pair Trade...
          </h2>
          <p className="text-white/70 text-lg mobile-text-lg">
            Opening {selectedPair.name} pair trade via Pear Protocol
          </p>
          <div className="glass-card p-4 rounded-lg border border-[#03b3c3]/30 mt-4">
            <p className="text-white/50 text-sm">
              This may take a few seconds as both legs of the trade are executed
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render pair trade setup
  if (currentView === "pair-trade-setup") {
    return (
      <div className="glass-card p-8 md:p-12 space-y-6 mobile-padding">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-heading font-black mobile-text-3xl">
            Setup Pair Trade
          </h2>
          <p className="text-white/70 text-lg mobile-text-lg">
            Configure your first pair trade on Pear Protocol
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">
              Select Pair
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_PAIRS.map((pair) => (
                <button
                  key={pair.id}
                  onClick={() => setSelectedPair(pair)}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedPair.id === pair.id
                      ? "border-[#03b3c3] bg-[#03b3c3]/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-white font-semibold">{pair.name}</div>
                  <div className="text-xs text-white/50 mt-1">
                    {pair.category}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">
              Trade Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTradeDirection("long-short")}
                className={`p-4 rounded-lg border transition-all ${
                  tradeDirection === "long-short"
                    ? "border-green-400 bg-green-400/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="text-white font-semibold">Long / Short</div>
                <div className="text-xs text-white/50 mt-1">
                  {selectedPair.asset1} / {selectedPair.asset2}
                </div>
              </button>
              <button
                onClick={() => setTradeDirection("short-long")}
                className={`p-4 rounded-lg border transition-all ${
                  tradeDirection === "short-long"
                    ? "border-red-400 bg-red-400/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="text-white font-semibold">Short / Long</div>
                <div className="text-xs text-white/50 mt-1">
                  {selectedPair.asset1} / {selectedPair.asset2}
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">
              Trade Amount (USD)
            </label>
            <input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
              min="10"
              step="10"
              className="glass-input w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white focus:border-[#03b3c3] focus:outline-none transition-colors"
            />
            <p className="text-xs text-white/50">Minimum: $10 USD</p>
          </div>

          <div className="glass-card p-4 rounded-lg border border-white/10">
            <div className="text-sm text-white/70 mb-2">Estimated Fees:</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Pear Protocol Fee:</span>
                <span className="text-white">${fees.pearFee.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Hyperliquid Execution:</span>
                <span className="text-white">
                  ${fees.hyperliquidFee.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                <span className="text-white/70 font-medium">Total:</span>
                <span className="text-[#03b3c3] font-semibold">
                  ${fees.totalFee.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <Button
              onClick={handleExecutePairTrade}
              disabled={isExecuting || tradeAmount < 10}
              className="w-full mobile-btn"
            >
              {isExecuting
                ? "Executing..."
                : `Execute Pair Trade ($${tradeAmount.toFixed(2)})`}
            </Button>
            <button
              onClick={() => setCurrentView("overview")}
              className="w-full px-6 py-3 text-white/70 hover:text-white transition-colors mobile-btn"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render overview dashboard
  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="glass-card p-6 md:p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4">
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
          Bridge Complete!
        </h2>
        <p className="text-white/70 text-lg">
          You now have{" "}
          <span className="text-[#03b3c3] font-bold">
            {parsedAmount.toFixed(4)} {token}
          </span>{" "}
          on HyperEVM
        </p>
      </div>

      {/* Wallet Status Overview */}
      <div className="glass-card p-6 border border-[#03b3c3]/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Wallet Status</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-medium">HyperEVM</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-lg bg-white/5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
              {token} Balance
            </p>
            <p className="text-2xl font-bold text-white">
              {parsedAmount.toFixed(4)}
            </p>
            <p className="text-xs text-[#03b3c3] mt-1">{token}</p>
          </div>
          <div className="glass-card p-4 rounded-lg bg-white/5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
              Gas Token
            </p>
            <p className="text-2xl font-bold text-white">
              {isEthLoading ? "..." : ethBalance?.formatted.slice(0, 8) || "0"}
            </p>
            <p
              className={`text-xs mt-1 ${
                hasLowGas ? "text-yellow-400" : "text-green-400"
              }`}
            >
              {hasLowGas ? "Low gas - top up needed" : "ETH"}
            </p>
          </div>
        </div>

        {/* Gas Warning */}
        {hasLowGas && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5"
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
              <div>
                <p className="text-yellow-400 text-sm font-medium">
                  Low Gas Balance
                </p>
                <p className="text-white/50 text-xs mt-1">
                  You&apos;ll need a small amount of ETH to transact on HyperEVM
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Last Action</span>
            <span className="text-white">
              Bridged via Relay ({getTimeSinceBridge()})
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      {txHash && (
        <div className="glass-card p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Bridge Transaction</span>
            <a
              href={`https://explorer.hyperliquid-testnet.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#03b3c3] text-sm hover:underline flex items-center gap-1"
            >
              View on Explorer
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
          <code className="text-xs text-white/50 break-all">{txHash}</code>
        </div>
      )}

      {/* Primary Actions */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">What&apos;s Next?</h3>

        {/* Open First Pair Trade */}
        <button
          onClick={handleQuickPairTrade}
          className="w-full glass-card p-6 rounded-lg border border-[#d856bf]/30 hover:border-[#d856bf]/50 transition-all group text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d856bf] to-[#ff6b6b] flex items-center justify-center shrink-0">
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
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-lg group-hover:text-[#d856bf] transition-colors">
                Open First Pair Trade
              </div>
              <div className="text-white/70 text-sm mt-1">
                Start pair trading with ${suggestion.params.amount.toFixed(2)}{" "}
                on Pear Protocol
              </div>
              <div className="text-xs text-white/50 mt-2">
                Suggested: {suggestion.pair.name} -{" "}
                {suggestion.rationale.slice(0, 60)}...
              </div>
            </div>
          </div>
        </button>

        {/* Deposit to Hyperliquid - Cross-sell */}
        <button
          onClick={onDepositClick}
          className="w-full glass-card p-6 rounded-lg border border-[#03b3c3]/30 hover:border-[#03b3c3]/50 transition-all group text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#03b3c3] to-[#d856bf] flex items-center justify-center shrink-0">
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
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg group-hover:text-[#03b3c3] transition-colors">
                  Want to trade instead?
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#03b3c3]/20 text-[#03b3c3]">
                  Recommended
                </span>
              </div>
              <div className="text-white/70 text-sm mt-1">
                Deposit to Hyperliquid for spot & perpetual trading
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-[#03b3c3]">Fast deposit</span>
                <span className="text-xs text-[#03b3c3]">Low fees</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Builder Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">For Builders</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {BUILDER_ACTIONS.map((action) => (
            <button
              key={action.title}
              onClick={action.isReset ? onReset : undefined}
              className="glass-card p-4 rounded-lg border border-white/10 hover:border-white/30 transition-all group text-left"
            >
              {!action.isReset ? (
                <a
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}
                  >
                    <svg
                      className="w-5 h-5 text-white"
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
                  <div className="text-white font-semibold text-sm group-hover:text-[#03b3c3] transition-colors">
                    {action.title}
                  </div>
                  <div className="text-white/50 text-xs mt-1">
                    {action.description}
                  </div>
                </a>
              ) : (
                <>
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}
                  >
                    <svg
                      className="w-5 h-5 text-white"
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
                  <div className="text-white font-semibold text-sm group-hover:text-[#03b3c3] transition-colors">
                    {action.title}
                  </div>
                  <div className="text-white/50 text-xs mt-1">
                    {action.description}
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Explore More */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Explore Hyperliquid</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EXPLORE_LINKS.map((link) => (
            <a
              key={link.title}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-4 rounded-lg border border-white/10 hover:border-[#03b3c3]/50 hover:bg-[#03b3c3]/5 transition-all group text-center"
            >
              <div className="w-10 h-10 rounded-full bg-[#03b3c3]/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-[#03b3c3]/30 transition-colors">
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
                    d={link.icon}
                  />
                </svg>
              </div>
              <div className="text-white font-semibold text-sm">
                {link.title}
              </div>
              <div className="text-white/50 text-xs mt-1">
                {link.description}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recovery Panel */}
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
              Resume bridge / Start new bridge
            </button>
            {txHash && (
              <a
                href={`https://explorer.hyperliquid-testnet.xyz/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-3 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                View raw transaction details
              </a>
            )}
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

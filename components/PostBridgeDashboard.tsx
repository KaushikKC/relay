"use client";

import { useState } from "react";
import Button from "./Button";
import {
  POPULAR_PAIRS,
  getBeginnerPairSuggestion,
  executePairTrade,
  formatPairTrade,
  estimatePairTradeFees,
  type PairTradeParams,
  type PairTradeResponse,
} from "@/lib/utils/pear-api";

interface PostBridgeDashboardProps {
  amount: string;
  token: string;
  onDepositClick: () => void; // Opens DepositToHyperliquid modal
  onReset: () => void; // Start new bridge
}

type DashboardView = "overview" | "pair-trade-setup" | "pair-trade-executing" | "pair-trade-success";

type PairType = typeof POPULAR_PAIRS[number];

export default function PostBridgeDashboard({
  amount,
  token,
  onDepositClick,
  onReset,
}: PostBridgeDashboardProps) {
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [selectedPair, setSelectedPair] = useState<PairType>(POPULAR_PAIRS[0]); // Default: ETH/BTC
  const [tradeDirection, setTradeDirection] = useState<"long-short" | "short-long">("long-short");
  const [tradeAmount, setTradeAmount] = useState<number>(20); // Default $20
  const [tradeResult, setTradeResult] = useState<PairTradeResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const suggestion = getBeginnerPairSuggestion(parsedAmount);

  const handleQuickPairTrade = () => {
    // Use the beginner suggestion
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
        leverage: 1, // No leverage for now
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
          {/* Success Icon */}
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
            Pair Trade Opened! 🎯
          </h2>
          <p className="text-white/70 text-lg mobile-text-lg">
            Your first pair trade is now live on Hyperliquid via Pear Protocol
          </p>

          {/* Trade Details */}
          <div className="glass-card p-6 rounded-lg border border-[#03b3c3]/30 mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Trade ID:</span>
              <code className="text-[#03b3c3] text-sm">{tradeResult.tradeId}</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Pair:</span>
              <span className="text-white font-semibold">{selectedPair.name}</span>
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
              <span className="text-white font-semibold">${tradeAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Position Details */}
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

          {/* Next Steps */}
          <div className="space-y-3 mt-8">
            <a
              href="https://www.pear.garden"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full mobile-btn">
                Manage Position on Pear Protocol →
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

          {/* Pair Selection */}
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
                  <div className="text-xs text-white/50 mt-1">{pair.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Direction Selection */}
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
                  ↑ {selectedPair.asset1} / ↓ {selectedPair.asset2}
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
                  ↓ {selectedPair.asset1} / ↑ {selectedPair.asset2}
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
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

          {/* Fee Estimate */}
          <div className="glass-card p-4 rounded-lg border border-white/10">
            <div className="text-sm text-white/70 mb-2">Estimated Fees:</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Pear Protocol Fee:</span>
                <span className="text-white">${fees.pearFee.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Hyperliquid Execution:</span>
                <span className="text-white">${fees.hyperliquidFee.toFixed(4)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                <span className="text-white/70 font-medium">Total:</span>
                <span className="text-[#03b3c3] font-semibold">
                  ${fees.totalFee.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
    <div className="glass-card p-8 md:p-12 space-y-8 mobile-padding">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-400/20 flex items-center justify-center mx-auto">
          <svg
            className="w-10 h-10 text-green-400"
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
        </div>
        <h2 className="text-3xl md:text-4xl font-heading font-black mobile-text-3xl">
          Bridge Complete! 🎉
        </h2>
        <p className="text-white/70 text-lg mobile-text-lg">
          You now have{" "}
          <span className="text-[#03b3c3] font-semibold">
            {parsedAmount.toFixed(2)} {token}
          </span>{" "}
          on HyperEVM
        </p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">What's Next?</h3>

        {/* Deposit to Hyperliquid */}
        <button
          onClick={onDepositClick}
          className="w-full glass-card p-6 rounded-lg border border-[#03b3c3]/30 hover:border-[#03b3c3]/50 transition-all group"
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
            <div className="flex-1 text-left">
              <div className="text-white font-bold text-lg group-hover:text-[#03b3c3] transition-colors">
                Deposit to Hyperliquid 🔥
              </div>
              <div className="text-white/70 text-sm mt-1">
                Move funds to your Hyperliquid trading account (&lt; 1 min)
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-[#03b3c3]">Fast deposit</span>
                <span className="text-xs text-[#03b3c3]">Low fees</span>
              </div>
            </div>
          </div>
        </button>

        {/* Open First Pair Trade */}
        <button
          onClick={handleQuickPairTrade}
          className="w-full glass-card p-6 rounded-lg border border-[#d856bf]/30 hover:border-[#d856bf]/50 transition-all group"
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
            <div className="flex-1 text-left">
              <div className="text-white font-bold text-lg group-hover:text-[#d856bf] transition-colors">
                Open First Pair Trade 🎯
              </div>
              <div className="text-white/70 text-sm mt-1">
                Start pair trading with ${suggestion.params.amount.toFixed(2)} on Pear Protocol
              </div>
              <div className="text-xs text-white/50 mt-2">
                Suggested: {suggestion.pair.name} - {suggestion.rationale.slice(0, 80)}...
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Other Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Explore More</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="https://app.hyperliquid.xyz/trade"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="text-white font-semibold">Spot Trading</div>
            <div className="text-xs text-white/50 mt-1">Trade on Hyperliquid</div>
          </a>
          <a
            href="https://app.hyperliquid.xyz/vaults"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="text-white font-semibold">Vaults</div>
            <div className="text-xs text-white/50 mt-1">Passive earning</div>
          </a>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-white/10">
        <button
          onClick={onReset}
          className="w-full px-6 py-3 text-white/70 hover:text-white transition-colors mobile-btn"
        >
          Bridge More Funds
        </button>
      </div>
    </div>
  );
}

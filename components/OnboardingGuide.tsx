"use client";

import { useState } from "react";
import Button from "./Button";

interface OnboardingGuideProps {
  amount: string;
  token: string;
  onAction: (action: string) => void;
  showDepositOption?: boolean; // NEW: Show deposit to Hyperliquid option
}

export default function OnboardingGuide({
  amount,
  token,
  onAction,
  showDepositOption = true,
}: OnboardingGuideProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const amountUSD = parseFloat(amount) || 0;

  const suggestions = [
    // NEW: Deposit to Hyperliquid option (shown first if enabled)
    ...(showDepositOption
      ? [
          {
            id: "deposit-to-hyperliquid",
            title: "Deposit to Hyperliquid 🔥",
            description:
              "Move funds from HyperEVM to your Hyperliquid trading account",
            riskLevel: "Low",
            estimatedCost: "$0.50",
            timeToStart: "< 1 min",
            recommended: amountUSD >= 5, // Minimum deposit is 5 USDC
            icon: "",
            deepLink: undefined, // Handled internally
            steps: [
              "Approve USDC for bridge",
              "Deposit to Hyperliquid",
              "Start trading instantly",
            ],
          },
        ]
      : []),
    {
      id: "spot-trading",
      title: "Start Spot Trading",
      description: "Trade spot markets with your bridged funds",
      riskLevel: "Low",
      estimatedCost: "$0.10 - $0.50",
      timeToStart: "< 1 min",
      recommended: amountUSD >= 100,
      icon: "",
      deepLink: "https://app.hyperliquid.xyz/trade",
      steps: [
        "Navigate to Hyperliquid spot markets",
        "Choose a trading pair (e.g., ETH/USDC)",
        "Place your first trade",
      ],
    },
    {
      id: "perpetual-trading",
      title: "Perpetual Futures",
      description: "Trade leveraged perpetual contracts",
      riskLevel: "Medium",
      estimatedCost: "$0.20 - $1.00",
      timeToStart: "2-3 min",
      recommended: amountUSD >= 500,
      icon: "",
      deepLink: "https://app.hyperliquid.xyz/trade",
      steps: [
        "Review leverage options (up to 50x)",
        "Understand liquidation risks",
        "Start with lower leverage positions",
        "Set stop-loss orders",
      ],
    },
    {
      id: "liquidity-provision",
      title: "Provide Liquidity",
      description: "Earn fees by providing liquidity to pools",
      riskLevel: "Medium",
      estimatedCost: "$0.50 - $2.00",
      timeToStart: "5 min",
      recommended: amountUSD >= 1000,
      icon: "",
      deepLink: "https://app.hyperliquid.xyz/pools",
      steps: [
        "Choose a liquidity pool",
        "Review APY and risks",
        "Deposit your funds",
        "Monitor your position",
      ],
    },
    {
      id: "vault-staking",
      title: "Passive Vault Staking",
      description: "Low-risk passive earning strategy",
      riskLevel: "Low",
      estimatedCost: "$0.10 - $0.30",
      timeToStart: "< 1 min",
      recommended: amountUSD >= 50,
      icon: "",
      deepLink: "https://app.hyperliquid.xyz/vaults",
      steps: [
        "Browse available vaults",
        "Review historical performance",
        "Deposit and earn passively",
      ],
    },
  ];

  const recommendedSuggestions = suggestions.filter((s) => s.recommended);
  const otherSuggestions = suggestions.filter((s) => !s.recommended);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-green-400";
      case "Medium":
        return "text-yellow-400";
      case "High":
        return "text-red-400";
      default:
        return "text-white";
    }
  };

  return (
    <div className="glass-card p-8 md:p-12 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
          What Should I Do Now?
        </h2>
        <p className="text-white/70 text-lg">
          You now have{" "}
          <span className="text-[#03b3c3] font-semibold">
            ${amountUSD.toFixed(2)} {token}
          </span>{" "}
          on Hyperliquid
        </p>
      </div>

      {/* Recommended Actions */}
      {recommendedSuggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            Recommended for You
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendedSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`glass-card p-6 cursor-pointer transition-all duration-300 ${
                  selectedAction === suggestion.id
                    ? "border-[#03b3c3] border-2"
                    : "border-white/10 border hover:border-white/30"
                }`}
                onClick={() => setSelectedAction(suggestion.id)}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{suggestion.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {suggestion.title}
                    </h4>
                    <p className="text-white/60 text-sm mb-4">
                      {suggestion.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      <div>
                        <span className="text-white/50">Risk: </span>
                        <span className={getRiskColor(suggestion.riskLevel)}>
                          {suggestion.riskLevel}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Cost: </span>
                        <span className="text-white">
                          {suggestion.estimatedCost}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-white/50">Time: </span>
                        <span className="text-white">
                          {suggestion.timeToStart}
                        </span>
                      </div>
                    </div>

                    {selectedAction === suggestion.id && (
                      <div className="mt-4 space-y-3">
                        <p className="text-white/70 text-sm font-semibold">
                          Next Steps:
                        </p>
                        <ol className="space-y-1 mb-3">
                          {suggestion.steps.map((step, idx) => (
                            <li
                              key={idx}
                              className="text-white/60 text-xs flex items-start gap-2"
                            >
                              <span className="text-[#03b3c3] font-bold">
                                {idx + 1}.
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(suggestion.deepLink, "_blank");
                            onAction(suggestion.id);
                          }}
                          className="w-full text-sm py-2 px-4 rounded-full bg-[#03b3c3] text-white font-semibold hover:bg-[#03b3c3]/80 transition-colors"
                        >
                          Get Started →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Options */}
      {otherSuggestions.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-semibold text-white">Other Options</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {otherSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="glass-card p-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => {
                  window.open(suggestion.deepLink, "_blank");
                  onAction(suggestion.id);
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{suggestion.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">
                      {suggestion.title}
                    </h4>
                    <p className="text-white/60 text-xs mb-2">
                      {suggestion.description}
                    </p>
                    <p className="text-white/50 text-xs mb-2">
                      Recommended: $
                      {Math.ceil(
                        parseFloat(
                          suggestion.estimatedCost
                            .split(" - ")[1]
                            .replace("$", "")
                        ) * 100
                      )}{" "}
                      USDC minimum
                    </p>
                    <span className="text-[#03b3c3] text-xs font-semibold">
                      Click to explore →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-8 border-t border-white/10">
        <Button
          onClick={() => window.open("https://app.hyperliquid.xyz", "_blank")}
        >
          Go to Hyperliquid
        </Button>
        <Button onClick={() => onAction("bridge-again")}>
          Bridge More Funds
        </Button>
      </div>

      {/* Educational Note */}
      <div className="glass-card p-4 mt-6 bg-[#03b3c3]/10 border-[#03b3c3]/30">
        <p className="text-white/80 text-sm">
          💡 <strong>New to Hyperliquid?</strong> Start with spot trading or
          passive vaults to get familiar with the platform before trying
          leveraged products.
        </p>
      </div>
    </div>
  );
}

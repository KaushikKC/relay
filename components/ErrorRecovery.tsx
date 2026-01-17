"use client";

import { useState } from "react";
import Button from "./Button";

interface ErrorRecoveryProps {
  error: string;
  txHash?: string;
  lastAction?: string;
  onRetry: () => void;
  onReset: () => void;
  onResume?: () => void;
}

export default function ErrorRecovery({
  error,
  txHash,
  lastAction,
  onRetry,
  onReset,
  onResume,
}: ErrorRecoveryProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorCategory = (errorMessage: string): {
    title: string;
    explanation: string;
    suggestions: string[];
    canRetry: boolean;
    canResume: boolean;
  } => {
    const errorLower = errorMessage.toLowerCase();

    // Insufficient funds
    if (
      errorLower.includes("insufficient") ||
      errorLower.includes("balance")
    ) {
      return {
        title: "Insufficient Funds",
        explanation:
          "You don't have enough tokens or gas to complete this transaction.",
        suggestions: [
          "Check your token balance on the source chain",
          "Ensure you have enough native tokens (ETH, MATIC, etc.) for gas fees",
          "Try bridging a smaller amount",
          "Add more funds to your wallet",
        ],
        canRetry: true,
        canResume: false,
      };
    }

    // User rejection
    if (
      errorLower.includes("rejected") ||
      errorLower.includes("denied") ||
      errorLower.includes("user rejected")
    ) {
      return {
        title: "Transaction Rejected",
        explanation: "You canceled the transaction in your wallet.",
        suggestions: [
          "Click 'Retry' to try again",
          "Make sure you approve the transaction in your wallet",
          "Check that you're connected to the correct network",
        ],
        canRetry: true,
        canResume: false,
      };
    }

    // Network/RPC issues
    if (
      errorLower.includes("network") ||
      errorLower.includes("rpc") ||
      errorLower.includes("timeout") ||
      errorLower.includes("connection")
    ) {
      return {
        title: "Network Connection Issue",
        explanation:
          "There was a problem connecting to the blockchain network.",
        suggestions: [
          "Check your internet connection",
          "Try switching to a different RPC endpoint in your wallet",
          "Wait a moment and retry - the network might be congested",
          "The transaction may have been submitted - check your wallet",
        ],
        canRetry: true,
        canResume: true,
      };
    }

    // Slippage issues
    if (errorLower.includes("slippage") || errorLower.includes("price")) {
      return {
        title: "Price Changed Too Much",
        explanation:
          "The token price changed significantly since the quote was generated.",
        suggestions: [
          "Get a fresh quote with current prices",
          "Consider increasing slippage tolerance (if available)",
          "Try breaking large trades into smaller ones",
        ],
        canRetry: true,
        canResume: false,
      };
    }

    // Route not found
    if (errorLower.includes("no routes") || errorLower.includes("no route")) {
      return {
        title: "No Bridge Route Available",
        explanation:
          "LI.FI couldn't find a route for this token pair and amount.",
        suggestions: [
          "Try a different token that's more widely supported",
          "Reduce the amount - very large amounts may not have routes",
          "Use a different source chain",
          "Check if the token is supported on both chains",
        ],
        canRetry: false,
        canResume: false,
      };
    }

    // Gas estimation failed
    if (errorLower.includes("gas") || errorLower.includes("estimation")) {
      return {
        title: "Transaction Simulation Failed",
        explanation: "The blockchain couldn't estimate the gas cost.",
        suggestions: [
          "Your wallet might not have enough ETH for gas",
          "The transaction might fail - review the parameters",
          "Try a smaller amount",
          "Check network congestion and try again later",
        ],
        canRetry: true,
        canResume: false,
      };
    }

    // Default unknown error
    return {
      title: "Something Went Wrong",
      explanation:
        "An unexpected error occurred during the bridge process.",
      suggestions: [
        "Try refreshing the page and starting over",
        "Check if your wallet is connected",
        "Verify you're on the correct network",
        "Contact support if the issue persists",
      ],
      canRetry: true,
      canResume: onResume !== undefined,
    };
  };

  const errorInfo = getErrorCategory(error);

  return (
    <div className="glass-card p-8 md:p-12 space-y-6">
      {/* Error Icon and Title */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-red-400/20 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-400"
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
        </div>
        <h2 className="text-3xl md:text-4xl font-heading font-black mb-4 text-red-400">
          {errorInfo.title}
        </h2>
        <p className="text-white/70 text-lg mb-6">{errorInfo.explanation}</p>
      </div>

      {/* What Happened */}
      <div className="glass-card p-6 bg-red-400/5 border-red-400/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">What Happened?</h3>
            {lastAction && (
              <p className="text-white/70 text-sm mb-2">
                Last action: <span className="text-white">{lastAction}</span>
              </p>
            )}
            {txHash && (
              <p className="text-white/70 text-sm">
                Transaction:{" "}
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#03b3c3] hover:underline font-mono"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span>💡</span>
          What You Can Do:
        </h3>
        <ul className="space-y-2">
          {errorInfo.suggestions.map((suggestion, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-white/70 text-sm"
            >
              <span className="text-[#03b3c3] font-bold mt-0.5">
                {idx + 1}.
              </span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Error Details (Collapsible) */}
      <div className="border-t border-white/10 pt-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-2"
        >
          <span>{showDetails ? "▼" : "▶"}</span>
          Technical Details
        </button>
        {showDetails && (
          <div className="mt-4 glass-card p-4 bg-black/30">
            <pre className="text-red-400 text-xs overflow-x-auto whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        {errorInfo.canResume && onResume && (
          <Button onClick={onResume}>Resume Transaction</Button>
        )}
        {errorInfo.canRetry && (
          <Button onClick={onRetry}>Try Again</Button>
        )}
        <Button onClick={onReset}>Start Over</Button>
      </div>

      {/* Help Section */}
      <div className="glass-card p-4 bg-[#03b3c3]/10 border-[#03b3c3]/30 text-center">
        <p className="text-white/80 text-sm">
          Still having issues?{" "}
          <a
            href="https://discord.gg/hyperliquid"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#03b3c3] hover:underline font-semibold"
          >
            Get help on Discord
          </a>{" "}
          or{" "}
          <a
            href="https://docs.hyperliquid.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#03b3c3] hover:underline font-semibold"
          >
            check the docs
          </a>
        </p>
      </div>
    </div>
  );
}

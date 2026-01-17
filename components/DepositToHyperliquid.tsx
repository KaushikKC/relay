"use client";

import { useState } from "react";
import Button from "./Button";
import { useAccount } from "wagmi";

interface DepositToHyperliquidProps {
  amount: string;
  token: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type DepositStatus =
  | "idle"
  | "checking"
  | "approving"
  | "depositing"
  | "success"
  | "error";

export default function DepositToHyperliquid({
  amount,
  token,
  onSuccess,
  onCancel,
}: DepositToHyperliquidProps) {
  const { address } = useAccount();
  const [depositStatus, setDepositStatus] = useState<DepositStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(60); // seconds

  const parsedAmount = parseFloat(amount) || 0;
  const MIN_DEPOSIT = 5; // USDC minimum

  // Mock deposit function - will be replaced with actual Hyperliquid bridge integration
  const executeDeposit = async () => {
    try {
      setDepositStatus("checking");
      setError(null);

      // Step 1: Check balance and minimum
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (parsedAmount < MIN_DEPOSIT) {
        throw new Error(
          `Minimum deposit is ${MIN_DEPOSIT} USDC. Your amount: ${parsedAmount} USDC`
        );
      }

      // Step 2: Approve USDC (if needed)
      setDepositStatus("approving");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("✅ USDC approved for bridge");

      // Step 3: Execute deposit to Hyperliquid bridge
      setDepositStatus("depositing");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock transaction hash
      const mockTxHash = `0x${Math.random()
        .toString(16)
        .slice(2)}${Math.random().toString(16).slice(2)}`;
      setTxHash(mockTxHash);
      console.log("✅ Deposit transaction submitted:", mockTxHash);

      // Step 4: Wait for confirmation (< 1 minute according to docs)
      setEstimatedTime(45);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setDepositStatus("success");
      console.log("🎉 Funds deposited to Hyperliquid!");

      // Call success callback
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err) {
      console.error("Error depositing to Hyperliquid:", err);
      setError(err instanceof Error ? err.message : "Failed to deposit");
      setDepositStatus("error");
    }
  };

  const handleRetry = () => {
    setDepositStatus("idle");
    setError(null);
    setTxHash(null);
  };

  // Render success state
  if (depositStatus === "success") {
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

          {/* Success Message */}
          <h2 className="text-3xl md:text-4xl font-heading font-black mobile-text-3xl">
            Funds Deposited! 🚀
          </h2>
          <p className="text-white/70 text-lg mobile-text-lg">
            Your{" "}
            <span className="text-[#03b3c3] font-semibold">
              {parsedAmount} {token}
            </span>{" "}
            are now tradable on Hyperliquid
          </p>

          {/* Transaction Details */}
          {txHash && (
            <div className="glass-card p-4 rounded-lg border border-[#03b3c3]/30 mt-4">
              <p className="text-white/50 text-sm mb-2">Transaction Hash:</p>
              <div className="flex items-center gap-2">
                <code className="text-[#03b3c3] text-xs break-all">
                  {txHash}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(txHash)}
                  className="shrink-0 p-2 hover:bg-white/10 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <svg
                    className="w-4 h-4 text-white/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="space-y-3 mt-6">
            <a
              href="https://app.hyperliquid.xyz/trade"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full mobile-btn">
                Start Trading on Hyperliquid →
              </Button>
            </a>
            <button
              onClick={onCancel}
              className="w-full px-6 py-3 text-white/70 hover:text-white transition-colors mobile-btn"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (depositStatus === "error") {
    return (
      <div className="glass-card p-8 md:p-12 space-y-6 mobile-padding">
        <div className="text-center space-y-4">
          {/* Error Icon */}
          <div className="w-20 h-20 rounded-full bg-red-400/20 flex items-center justify-center mx-auto">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-3xl md:text-4xl font-heading font-black text-red-400 mobile-text-3xl">
            Deposit Failed
          </h2>
          <p className="text-white/70 text-lg mobile-text-lg">
            {error || "An error occurred during the deposit process"}
          </p>

          {/* Error Details */}
          <div className="glass-card p-4 rounded-lg border border-red-400/30 mt-4">
            <p className="text-red-400 text-sm">
              {error?.includes("Minimum") ? (
                <>
                  <strong>Minimum Deposit Not Met</strong>
                  <br />
                  The Hyperliquid bridge requires a minimum deposit of 5 USDC.
                  Please bridge more funds or adjust your deposit amount.
                </>
              ) : (
                <>
                  <strong>Transaction Error</strong>
                  <br />
                  Please check your wallet connection and try again. If the
                  issue persists, contact support.
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6">
            <Button onClick={handleRetry} className="w-full mobile-btn">
              Try Again
            </Button>
            <button
              onClick={onCancel}
              className="w-full px-6 py-3 text-white/70 hover:text-white transition-colors mobile-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render loading/processing state
  if (depositStatus !== "idle") {
    return (
      <div className="glass-card p-8 md:p-12 space-y-6 mobile-padding">
        <div className="text-center space-y-4">
          {/* Loading Spinner */}
          <div className="w-20 h-20 rounded-full border-4 border-[#03b3c3]/20 border-t-[#03b3c3] flex items-center justify-center mx-auto animate-spin" />

          {/* Status Messages */}
          <h2 className="text-3xl md:text-4xl font-heading font-black mobile-text-3xl">
            {depositStatus === "checking" && "Checking Balance..."}
            {depositStatus === "approving" && "Approving USDC..."}
            {depositStatus === "depositing" && "Depositing to Hyperliquid..."}
          </h2>
          <p className="text-white/70 text-lg mobile-text-lg">
            {depositStatus === "checking" &&
              "Verifying your balance and deposit amount"}
            {depositStatus === "approving" &&
              "Please approve the transaction in your wallet"}
            {depositStatus === "depositing" &&
              `Estimated time: ~${estimatedTime} seconds`}
          </p>

          {/* Progress Steps */}
          <div className="space-y-3 mt-8">
            {[
              { label: "Check Balance", status: "checking" },
              { label: "Approve USDC", status: "approving" },
              { label: "Deposit to Bridge", status: "depositing" },
            ].map((step, idx) => {
              const isActive = depositStatus === step.status;
              const isCompleted =
                (depositStatus === "approving" && step.status === "checking") ||
                (depositStatus === "depositing" &&
                  (step.status === "checking" || step.status === "approving"));

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#03b3c3]/20 border border-[#03b3c3]/50"
                      : isCompleted
                      ? "bg-green-400/10 border border-green-400/30"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
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
                  ) : isActive ? (
                    <div className="w-6 h-6 border-2 border-[#03b3c3] border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-white/30 shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isActive || isCompleted ? "text-white" : "text-white/50"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Transaction Hash (if available) */}
          {txHash && (
            <div className="glass-card p-4 rounded-lg border border-[#03b3c3]/30 mt-4">
              <p className="text-white/50 text-sm mb-2">
                Transaction Submitted:
              </p>
              <code className="text-[#03b3c3] text-xs break-all">{txHash}</code>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render initial CTA state
  return (
    <div className="glass-card p-8 md:p-12 space-y-6 mobile-padding">
      <div className="text-center space-y-4">
        {/* Hyperliquid Logo/Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#03b3c3] to-[#d856bf] flex items-center justify-center mx-auto">
          <svg
            className="w-10 h-10 text-white"
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

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-heading font-black mobile-text-3xl">
          Deposit to Hyperliquid
        </h2>
        <p className="text-white/70 text-lg mobile-text-lg">
          Move your {parsedAmount} {token} from HyperEVM to your Hyperliquid
          trading account
        </p>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="glass-card p-4 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-[#03b3c3]">&lt; 1 min</div>
            <div className="text-sm text-white/50 mt-1">Deposit Time</div>
          </div>
          <div className="glass-card p-4 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-[#03b3c3]">
              ${parsedAmount.toFixed(2)}
            </div>
            <div className="text-sm text-white/50 mt-1">Amount</div>
          </div>
          <div className="glass-card p-4 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-[#03b3c3]">~$0.50</div>
            <div className="text-sm text-white/50 mt-1">Gas Cost</div>
          </div>
        </div>

        {/* Minimum Deposit Warning */}
        {parsedAmount < MIN_DEPOSIT && (
          <div className="glass-card p-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 mt-4">
            <p className="text-yellow-400 text-sm">
              ⚠️ <strong>Warning:</strong> The minimum deposit is {MIN_DEPOSIT}{" "}
              USDC. Your current amount ({parsedAmount} {token}) is below this
              threshold. Please bridge more funds first.
            </p>
          </div>
        )}

        {/* Benefits List */}
        <div className="text-left space-y-2 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-green-400"
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
            <p className="text-white/70 text-sm">
              Instant access to perpetual and spot trading
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-green-400"
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
            <p className="text-white/70 text-sm">
              No gas fees for trades on Hyperliquid
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-green-400"
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
            <p className="text-white/70 text-sm">
              Withdraw back to Arbitrum anytime in 3-4 minutes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mt-8">
          <Button
            onClick={executeDeposit}
            disabled={parsedAmount < MIN_DEPOSIT}
            className="w-full mobile-btn"
          >
            {parsedAmount < MIN_DEPOSIT
              ? "Insufficient Amount (Min 5 USDC)"
              : "Deposit to Hyperliquid"}
          </Button>
          <button
            onClick={onCancel}
            className="w-full px-6 py-3 text-white/70 hover:text-white transition-colors mobile-btn"
          >
            Skip for Now
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-white/40 text-xs mt-4">
          By depositing, you agree to Hyperliquid&apos;s{" "}
          <a
            href="https://hyperliquid.xyz/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#03b3c3] hover:underline"
          >
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}

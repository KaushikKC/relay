"use client";

import type { PersistedBridgeState } from "@/lib/utils/transactionPersistence";
import Button from "./Button";

interface PartialFailureRecoveryProps {
  partialFailure: NonNullable<PersistedBridgeState["partialSuccess"]>;
  onRetryBridge: () => void;
  onViewFunds: () => void;
}

export default function PartialFailureRecovery({
  partialFailure,
  onRetryBridge,
  onViewFunds,
}: PartialFailureRecoveryProps) {
  return (
    <div className="glass-card p-8 md:p-12 space-y-6 border-yellow-400/30 bg-yellow-400/5">
      <div className="flex items-start gap-4">
        <svg
          className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1"
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
        <div className="flex-1">
          <h2 className="text-2xl font-heading font-black mb-2 text-yellow-400">
            Bridge Failed Midway
          </h2>
          <p className="text-white/80 mb-4">
            Your swap succeeded, but bridging failed. Your funds are safe on{" "}
            <span className="font-semibold text-white">
              {partialFailure.fundsLocation.chainName}
            </span>
            .
          </p>
        </div>
      </div>
      <div className="glass-card p-4 bg-white/5 space-y-3">
        <h3 className="text-white font-semibold mb-2">Funds Location:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/70">Chain:</span>
            <span className="text-white">
              {partialFailure.fundsLocation.chainName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Token:</span>
            <span className="text-white">
              {partialFailure.fundsLocation.amount}{" "}
              {partialFailure.fundsLocation.tokenSymbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Status:</span>
            <span className="text-green-400">Safe ✓</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-white font-semibold">What Happened:</h3>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✓</span>
            <span>
              Steps 1-{partialFailure.completedSteps.length} completed
              successfully
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-1">✗</span>
            <span>
              Step {partialFailure.failedStepIndex + 1} failed during bridging
            </span>
          </li>
        </ul>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
        <Button onClick={onRetryBridge} className="flex-1">
          Retry Bridge
        </Button>
        <button
          onClick={onViewFunds}
          className="flex-1 px-8 py-4 text-lg font-bold text-white bg-transparent border-2 border-white/20 rounded-[50px] hover:border-white/40 transition-colors"
        >
          View Funds on {partialFailure.fundsLocation.chainName}
        </button>
        <a
          href="https://docs.hyperliquid.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <button className="w-full px-8 py-4 text-lg font-bold text-white bg-transparent border-2 border-white/20 rounded-[50px] hover:border-white/40 transition-colors flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4"
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
            Get Help
          </button>
        </a>
      </div>
    </div>
  );
}

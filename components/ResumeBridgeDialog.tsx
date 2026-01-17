"use client";

import { useState } from "react";
import type { PersistedBridgeState } from "@/lib/utils/transactionPersistence";
import Button from "./Button";

interface ResumeBridgeDialogProps {
  savedState: PersistedBridgeState;
  onResume: () => void;
  onDismiss: () => void;
}

export default function ResumeBridgeDialog({
  savedState,
  onResume,
  onDismiss,
}: ResumeBridgeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleResume = async () => {
    setIsLoading(true);
    await onResume();
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card p-8 md:p-12 max-w-2xl w-full mx-4 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#03b3c3]/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#03b3c3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-heading font-black mb-4">
            Resume Bridge?
          </h2>
          <p className="text-white/70 mb-6">
            We detected an in-progress bridge transaction. Would you like to
            resume?
          </p>
        </div>
        <div className="glass-card p-4 bg-white/5 space-y-2">
          <div className="flex justify-between">
            <span className="text-white/70">Route ID:</span>
            <span className="text-white font-mono text-sm">
              {savedState.routeId?.slice(0, 16)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Amount:</span>
            <span className="text-white">{savedState.amount} tokens</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Status:</span>
            <span className="text-[#03b3c3] capitalize">
              {savedState.status}
            </span>
          </div>
          {savedState.currentStepIndex !== undefined && (
            <div className="flex justify-between">
              <span className="text-white/70">Progress:</span>
              <span className="text-white">
                Step {savedState.currentStepIndex + 1} of{" "}
                {savedState.steps?.length || "?"}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleResume}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Resuming..." : "Resume Bridge"}
          </Button>
          <button
            onClick={onDismiss}
            disabled={isLoading}
            className="flex-1 px-8 py-4 text-lg font-bold text-white bg-transparent border-2 border-white/20 rounded-[50px] hover:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start New
          </button>
        </div>
      </div>
    </div>
  );
}

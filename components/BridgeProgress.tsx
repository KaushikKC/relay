"use client";

import type { BridgeStep } from "@/lib/hooks/useLiFiBridge";

interface BridgeProgressProps {
  steps: BridgeStep[];
  currentStepIndex: number;
  onRetryStep?: (stepIndex: number) => void;
}

export default function BridgeProgress({
  steps,
  currentStepIndex,
  onRetryStep,
}: BridgeProgressProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <StepCard
          key={step.stepIndex}
          step={step}
          isActive={index === currentStepIndex}
          isCompleted={index < currentStepIndex}
          onRetry={onRetryStep ? () => onRetryStep(step.stepIndex) : undefined}
        />
      ))}
    </div>
  );
}

function StepCard({
  step,
  isActive,
  isCompleted,
  onRetry,
}: {
  step: BridgeStep;
  isActive: boolean;
  isCompleted: boolean;
  onRetry?: () => void;
}) {
  const getStatusIcon = () => {
    switch (step.status) {
      case "success":
        return (
          <svg
            className="w-6 h-6 text-green-400"
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
        );
      case "failed":
        return (
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "in-progress":
        return (
          <div className="w-6 h-6 border-4 border-[#03b3c3] border-t-transparent rounded-full animate-spin" />
        );
      default:
        return (
          <svg
            className="w-6 h-6 text-white/30"
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
        );
    }
  };

  return (
    <div
      className={`glass-card p-4 rounded-lg border transition-all ${
        isActive
          ? "border-[#03b3c3] bg-[#03b3c3]/10"
          : isCompleted
          ? "border-green-400/30 bg-green-400/5"
          : "border-white/10"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-white font-semibold">{step.title}</h4>
            <span className="text-xs text-white/50">
              Step {step.stepIndex + 1}
            </span>
          </div>

          <p className="text-sm text-white/70 mb-2">{step.description}</p>

          {step.txHash && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <a
                href={step.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#03b3c3] hover:underline flex items-center gap-1"
              >
                View Transaction
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
              <span className="text-xs text-white/30 font-mono">
                {step.txHash.slice(0, 10)}...{step.txHash.slice(-8)}
              </span>
            </div>
          )}

          {step.error && (
            <div className="mt-2 p-2 bg-red-400/10 border border-red-400/30 rounded text-sm text-red-400">
              {step.error}
            </div>
          )}

          {step.status === "failed" && step.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-4 py-2 bg-[#03b3c3] text-white rounded-lg text-sm font-medium hover:bg-[#03b3c3]/80 transition-colors"
            >
              Retry Step
            </button>
          )}

          {step.estimatedTime && step.status === "in-progress" && (
            <p className="text-xs text-white/50 mt-2">
              Estimated: ~{Math.ceil(step.estimatedTime / 60)} min
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

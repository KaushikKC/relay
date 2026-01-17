/**
 * Transaction State Persistence
 * Allows users to refresh the page without losing their bridge progress
 */

import type { RouteExtended } from "@lifi/sdk";
import type { BridgeStep } from "@/lib/hooks/useLiFiBridge";

export interface PersistedBridgeState {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  txHash?: string;
  status: string;
  timestamp: number;
  routeData?: RouteExtended;
  routeId?: string; // NEW
  steps?: BridgeStep[]; // NEW: Persist step state
  currentStepIndex?: number; // NEW
  partialSuccess?: {
    // NEW: Track partial failures
    completedSteps: number[];
    failedStepIndex: number;
    fundsLocation: {
      chainId: number;
      chainName: string;
      tokenAddress: string;
      tokenSymbol: string;
      amount: string;
    };
  };
}

const STORAGE_KEY = "relay_bridge_state";
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save bridge state to localStorage
 */
export function saveBridgeState(state: PersistedBridgeState): void {
  try {
    const dataToSave = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Failed to save bridge state:", error);
  }
}

/**
 * Load bridge state from localStorage
 */
export function loadBridgeState(): PersistedBridgeState | null {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return null;

    const state: PersistedBridgeState = JSON.parse(savedData);

    // Check if state is expired
    const now = Date.now();
    if (now - state.timestamp > EXPIRY_TIME) {
      clearBridgeState();
      return null;
    }

    return state;
  } catch (error) {
    console.error("Failed to load bridge state:", error);
    return null;
  }
}

/**
 * Clear saved bridge state
 */
export function clearBridgeState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear bridge state:", error);
  }
}

/**
 * Check if there's a pending transaction
 */
export function hasPendingTransaction(): boolean {
  const state = loadBridgeState();
  if (!state) return false;

  const pendingStatuses = ["executing", "bridging", "approving"];
  return pendingStatuses.includes(state.status);
}

/**
 * Save detailed bridge state with steps and route information
 */
export function saveDetailedBridgeState(
  route: RouteExtended,
  steps: BridgeStep[],
  currentStepIndex: number
): void {
  try {
    const state: PersistedBridgeState = {
      fromChainId: route.fromChainId,
      toChainId: route.toChainId,
      fromTokenAddress: route.fromToken.address,
      toTokenAddress: route.toToken.address,
      amount: route.fromAmount,
      status: "executing", // Keep as executing if in progress
      timestamp: Date.now(),
      routeData: route,
      routeId: route.id,
      steps,
      currentStepIndex,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save detailed bridge state:", error);
  }
}

/**
 * Get chain name from chain ID
 */
function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: "Ethereum",
    42161: "Arbitrum",
    8453: "Base",
    10: "Optimism",
    137: "Polygon",
    56: "BSC",
    999: "HyperEVM",
  };
  return chains[chainId] || `Chain ${chainId}`;
}

/**
 * Detect partial failure in bridge execution
 */
export function detectPartialFailure(
  route: RouteExtended,
  steps: BridgeStep[]
): PersistedBridgeState["partialSuccess"] | null {
  // Find first failed step
  const failedStepIndex = steps.findIndex((step) => step.status === "failed");
  if (failedStepIndex === -1) return null;

  // Find last successful step to determine where funds are
  const lastSuccessIndex = failedStepIndex - 1;
  if (lastSuccessIndex < 0) return null;

  const lastSuccessStep = steps[lastSuccessIndex];
  const stepData = route.steps[lastSuccessIndex];

  return {
    completedSteps: steps
      .slice(0, failedStepIndex)
      .map((_, idx) => idx)
      .filter((idx) => steps[idx].status === "success"),
    failedStepIndex,
    fundsLocation: {
      chainId: lastSuccessStep.chainId || stepData.action.toChainId,
      chainName: getChainName(
        lastSuccessStep.chainId || stepData.action.toChainId
      ),
      tokenAddress: stepData.action.toToken.address,
      tokenSymbol: stepData.action.toToken.symbol,
      amount:
        ("toAmount" in stepData.action
          ? (stepData.action as { toAmount?: string }).toAmount
          : undefined) ||
        stepData.estimate.toAmount ||
        "0",
    },
  };
}

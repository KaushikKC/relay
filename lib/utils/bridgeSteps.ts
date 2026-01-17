import type { RouteExtended, LiFiStep } from "@lifi/sdk";
import type { BridgeStep, StepStatus } from "@/lib/hooks/useLiFiBridge";
import type { DestinationType } from "@/lib/config/lifi";

// Destination-aware step mapping
export function mapRouteToSteps(
  route: RouteExtended,
  destinationType: DestinationType = "hyperevm"
): BridgeStep[] {
  if (destinationType === "hyperliquid") {
    return mapRouteToHyperliquidSteps(route);
  }
  return mapRouteToHyperEvmSteps(route);
}

// Original HyperEVM flow
function mapRouteToHyperEvmSteps(route: RouteExtended): BridgeStep[] {
  const steps: BridgeStep[] = [];

  route.steps.forEach((lifiStep, index) => {
    // Use type assertion to handle LI.FI SDK type variations
    const stepType = (lifiStep as any).type as string;
    const toolName = lifiStep.toolDetails?.name?.toLowerCase() || "";
    
    // Step 1: Approval (if needed) - check by tool name
    if (
      stepType === "approval" ||
      toolName.includes("approval")
    ) {
      steps.push({
        stepIndex: steps.length,
        type: "approval",
        title: "Approving Token",
        description: `Approve ${lifiStep.action.fromToken.symbol} for swapping`,
        status: getStepStatus(lifiStep),
        txHash: getStepTxHash(lifiStep),
        chainId: lifiStep.action.fromChainId,
        explorerUrl: getExplorerUrl(
          lifiStep.action.fromChainId,
          getStepTxHash(lifiStep)
        ),
        canRetry: canRetryStep(lifiStep),
        error: getStepError(lifiStep),
        estimatedTime: lifiStep.estimate.executionDuration,
      });
    }

    // Step 2: Swap on source chain - check if it's a swap action
    if (
      stepType === "swap" ||
      toolName.includes("swap") ||
      (lifiStep.action.fromChainId === lifiStep.action.toChainId &&
        lifiStep.action.fromToken.address !== lifiStep.action.toToken.address)
    ) {
      steps.push({
        stepIndex: steps.length,
        type: "swap",
        title: "Swapping on Source Chain",
        description: `${lifiStep.action.fromToken.symbol} → ${lifiStep.action.toToken.symbol}`,
        status: getStepStatus(lifiStep),
        txHash: getStepTxHash(lifiStep),
        chainId: lifiStep.action.fromChainId,
        explorerUrl: getExplorerUrl(
          lifiStep.action.fromChainId,
          getStepTxHash(lifiStep)
        ),
        canRetry: canRetryStep(lifiStep),
        error: getStepError(lifiStep),
        estimatedTime: lifiStep.estimate.executionDuration,
      });
    }

    // Step 3: Bridge - check if it's a cross-chain action
    if (
      stepType === "cross" ||
      stepType === "bridge" ||
      stepType === "lifi" ||
      toolName.includes("bridge") ||
      lifiStep.action.fromChainId !== lifiStep.action.toChainId
    ) {
      steps.push({
        stepIndex: steps.length,
        type: "bridge",
        title: "Bridging to HyperEVM",
        description: `Moving funds from ${getChainName(
          lifiStep.action.fromChainId
        )} to HyperEVM`,
        status: getStepStatus(lifiStep),
        txHash: getStepTxHash(lifiStep),
        chainId: lifiStep.action.fromChainId,
        explorerUrl: getExplorerUrl(
          lifiStep.action.fromChainId,
          getStepTxHash(lifiStep)
        ),
        canRetry: canRetryStep(lifiStep),
        error: getStepError(lifiStep),
        estimatedTime: lifiStep.estimate.executionDuration,
      });
    }
  });

  // Step 4: Receiving on HyperEVM
  steps.push({
    stepIndex: steps.length,
    type: "receive",
    title: "Receiving on HyperEVM",
    description: "Waiting for funds to arrive on HyperEVM",
    status: "pending",
    chainId: route.toChainId,
    canRetry: false,
  });

  // Step 5: Post-bridge actions (if auto-deposit enabled)
  // This will be added conditionally

  return steps;
}

function getStepStatus(step: LiFiStep): StepStatus {
  const execution = (step as any).execution;
  if (!execution) return "pending";

  switch (execution.status) {
    case "DONE":
      return "success";
    case "FAILED":
      return "failed";
    case "PENDING":
    case "ACTION_REQUIRED":
      return "in-progress";
    default:
      return "pending";
  }
}

function getStepTxHash(step: LiFiStep): string | undefined {
  const execution = (step as any).execution;
  return execution?.process?.[0]?.txHash;
}

function canRetryStep(step: LiFiStep): boolean {
  const stepType = (step as any).type as string;
  const execution = (step as any).execution;
  return (
    execution?.status === "FAILED" &&
    stepType !== "approval" &&
    !step.toolDetails?.name?.toLowerCase().includes("approval")
  );
}

function getStepError(step: LiFiStep): string | undefined {
  const execution = (step as any).execution;
  if (execution?.status === "FAILED") {
    return (
      execution.process?.[0]?.error?.message || "Step failed"
    );
  }
  return undefined;
}

function getExplorerUrl(
  chainId: number,
  txHash?: string
): string | undefined {
  if (!txHash) return undefined;

  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/",
    42161: "https://arbiscan.io/tx/",
    8453: "https://basescan.org/tx/",
    10: "https://optimistic.etherscan.io/tx/",
    137: "https://polygonscan.com/tx/",
    56: "https://bscscan.com/tx/",
    999: "https://hyperevmscan.io/tx/", // HyperEVM
  };

  return explorers[chainId]
    ? `${explorers[chainId]}${txHash}`
    : undefined;
}

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

// Hyperliquid Exchange flow (via Arbitrum)
function mapRouteToHyperliquidSteps(route: RouteExtended): BridgeStep[] {
  const steps: BridgeStep[] = [];

  route.steps.forEach((lifiStep) => {
    const stepType = (lifiStep as any).type as string;
    const toolName = lifiStep.toolDetails?.name?.toLowerCase() || "";

    // Step: Approval (if needed)
    if (stepType === "approval" || toolName.includes("approval")) {
      steps.push({
        stepIndex: steps.length,
        type: "approval",
        title: "Approving Token",
        description: `Approve ${lifiStep.action.fromToken.symbol} for bridging`,
        status: getStepStatus(lifiStep),
        txHash: getStepTxHash(lifiStep),
        chainId: lifiStep.action.fromChainId,
        explorerUrl: getExplorerUrl(
          lifiStep.action.fromChainId,
          getStepTxHash(lifiStep)
        ),
        canRetry: canRetryStep(lifiStep),
        error: getStepError(lifiStep),
        estimatedTime: lifiStep.estimate.executionDuration,
      });
    }

    // Step: Swap on source chain
    if (
      stepType === "swap" ||
      toolName.includes("swap") ||
      (lifiStep.action.fromChainId === lifiStep.action.toChainId &&
        lifiStep.action.fromToken.address !== lifiStep.action.toToken.address)
    ) {
      steps.push({
        stepIndex: steps.length,
        type: "swap",
        title: "Swapping on Source Chain",
        description: `${lifiStep.action.fromToken.symbol} → ${lifiStep.action.toToken.symbol}`,
        status: getStepStatus(lifiStep),
        txHash: getStepTxHash(lifiStep),
        chainId: lifiStep.action.fromChainId,
        explorerUrl: getExplorerUrl(
          lifiStep.action.fromChainId,
          getStepTxHash(lifiStep)
        ),
        canRetry: canRetryStep(lifiStep),
        error: getStepError(lifiStep),
        estimatedTime: lifiStep.estimate.executionDuration,
      });
    }

    // Step: Bridge to Arbitrum (instead of HyperEVM)
    if (
      stepType === "cross" ||
      stepType === "bridge" ||
      stepType === "lifi" ||
      toolName.includes("bridge") ||
      lifiStep.action.fromChainId !== lifiStep.action.toChainId
    ) {
      steps.push({
        stepIndex: steps.length,
        type: "bridge",
        title: "Bridging to Arbitrum",
        description: `Moving USDC from ${getChainName(lifiStep.action.fromChainId)} to Arbitrum`,
        status: getStepStatus(lifiStep),
        txHash: getStepTxHash(lifiStep),
        chainId: lifiStep.action.fromChainId,
        explorerUrl: getExplorerUrl(
          lifiStep.action.fromChainId,
          getStepTxHash(lifiStep)
        ),
        canRetry: canRetryStep(lifiStep),
        error: getStepError(lifiStep),
        estimatedTime: lifiStep.estimate.executionDuration,
      });
    }
  });

  // Step: Receiving on Arbitrum
  steps.push({
    stepIndex: steps.length,
    type: "receive",
    title: "Receiving on Arbitrum",
    description: "Waiting for USDC to arrive on Arbitrum",
    status: "pending",
    chainId: 42161, // Arbitrum
    canRetry: false,
    estimatedTime: 60,
  });

  // Step: Approve USDC for Hyperliquid Bridge
  steps.push({
    stepIndex: steps.length,
    type: "post-bridge",
    title: "Approving for Hyperliquid",
    description: "Approve USDC for the Hyperliquid Bridge contract",
    status: "pending",
    chainId: 42161,
    canRetry: true,
    estimatedTime: 30,
  });

  // Step: Deposit to Hyperliquid
  steps.push({
    stepIndex: steps.length,
    type: "post-bridge",
    title: "Depositing to Hyperliquid",
    description: "Transferring USDC to your Hyperliquid trading account",
    status: "pending",
    chainId: 42161,
    canRetry: true,
    estimatedTime: 60,
  });

  return steps;
}

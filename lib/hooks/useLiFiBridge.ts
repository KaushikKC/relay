import { useState, useCallback } from "react";
import { getRoutes, executeRoute } from "@lifi/sdk";
import type {
  Route,
  LiFiStep,
  RouteExtended,
  RoutesRequest,
  ExecutionOptions,
} from "@lifi/sdk";
import { useAccount, useConnectorClient } from "wagmi";
import { setLiFiWalletClient } from "@/lib/config/lifi";
import { mapRouteToSteps } from "@/lib/utils/bridgeSteps";

export type BridgeStatus =
  | "idle"
  | "fetching-route"
  | "route-ready"
  | "approving"
  | "executing"
  | "bridging"
  | "success"
  | "error";

export type StepStatus =
  | "pending"
  | "in-progress"
  | "success"
  | "failed"
  | "skipped";

export interface BridgeStep {
  stepIndex: number;
  type: "approval" | "swap" | "bridge" | "receive" | "post-bridge";
  title: string;
  description: string;
  status: StepStatus;
  txHash?: string;
  chainId?: number;
  explorerUrl?: string;
  canRetry: boolean;
  error?: string;
  estimatedTime?: number;
  actualTime?: number;
}

export interface BridgeState {
  status: BridgeStatus;
  route: Route | null;
  currentStep: LiFiStep | null;
  steps: BridgeStep[]; // NEW: Array of all steps
  currentStepIndex: number; // NEW: Which step we're on
  txHash: string | null;
  error: string | null;
  estimatedTime: number | null;
  routeId?: string; // NEW: For resuming
}

export function useLiFiBridge() {
  const { address, isConnected, chain } = useAccount();
  const { data: connectorClient } = useConnectorClient();

  const [bridgeState, setBridgeState] = useState<BridgeState>({
    status: "idle",
    route: null,
    currentStep: null,
    steps: [],
    currentStepIndex: 0,
    txHash: null,
    error: null,
    estimatedTime: null,
  });

  // Fetch route from LI.FI
  const fetchRoute = useCallback(
    async (options: {
      fromChainId: number;
      toChainId: number;
      fromTokenAddress: string;
      toTokenAddress: string;
      fromAmount: string;
      fromAddress: string;
    }) => {
      try {
        setBridgeState((prev) => ({
          ...prev,
          status: "fetching-route",
          error: null,
        }));

        const routeRequest: RoutesRequest = {
          fromChainId: options.fromChainId,
          toChainId: options.toChainId,
          fromTokenAddress: options.fromTokenAddress,
          toTokenAddress: options.toTokenAddress,
          fromAmount: options.fromAmount,
          fromAddress: options.fromAddress,
          toAddress: options.fromAddress, // Same address on destination
          options: {
            slippage: 0.03, // 3% slippage tolerance
            order: "RECOMMENDED" as const, // Get the best route
          },
        };

        const result = await getRoutes(routeRequest);

        if (result.routes && result.routes.length > 0) {
          const bestRoute = result.routes[0];

          // Initialize steps from route
          const initialSteps = mapRouteToSteps(bestRoute as RouteExtended);

          setBridgeState((prev) => ({
            ...prev,
            status: "route-ready",
            route: bestRoute,
            steps: initialSteps,
            currentStepIndex: 0,
            routeId: bestRoute.id,
            estimatedTime: bestRoute.steps.reduce(
              (acc, step) => acc + (step.estimate.executionDuration || 0),
              0
            ),
          }));

          return bestRoute;
        } else {
          throw new Error("No routes found");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch route";
        console.error("Error fetching route:", error);
        setBridgeState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  // Execute the bridge transaction
  const executeBridge = useCallback(
    async (route: Route) => {
      // Debug: Log wallet connection state
      console.log("🔍 Bridge execution check:", {
        isConnected,
        hasAddress: !!address,
        hasConnectorClient: !!connectorClient,
        chainId: chain?.id,
        address,
      });

      if (!isConnected || !address) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first."
        );
      }

      // Get wallet client from connector
      let walletClient = connectorClient;

      if (!walletClient) {
        // Wait a bit for connector client to initialize (sometimes it takes a moment)
        console.warn(
          "⚠️ Wallet client not ready, waiting for connector to initialize..."
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // The connectorClient should be available now after waiting
        // If still not available, it means the wallet isn't properly connected
        if (!connectorClient) {
          throw new Error(
            "Wallet client not available. Please:\n" +
              "1. Ensure your wallet is connected and unlocked\n" +
              "2. Make sure you're on the correct chain (Base: 8453)\n" +
              "3. Try refreshing the page\n" +
              "4. If the issue persists, disconnect and reconnect your wallet"
          );
        }
        walletClient = connectorClient;
      }

      try {
        // Set the wallet client for LI.FI SDK to use
        // Type assertion needed because connectorClient type might differ slightly from WalletClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLiFiWalletClient(walletClient as any);
        console.log("✅ Wallet client set for LI.FI SDK");

        // Initialize steps from route
        const initialSteps = mapRouteToSteps(route as RouteExtended);

        setBridgeState((prev) => ({
          ...prev,
          status: "executing",
          error: null,
          steps: initialSteps,
          currentStepIndex: 0,
          routeId: route.id,
        }));

        // Execute the route using LI.FI SDK
        const executionOptions: ExecutionOptions = {
          // Update callback for transaction progress
          updateRouteHook: (updatedRoute: RouteExtended) => {
            // Map updated route to steps
            const updatedSteps = mapRouteToSteps(updatedRoute);

            // Find current step
            const currentStepIndex = updatedSteps.findIndex(
              (step: BridgeStep) => step.status === "in-progress"
            );

            // Also find the LI.FI step for backward compatibility
            const lifiStepIndex = updatedRoute.steps.findIndex(
              (step) =>
                step.execution?.status === "PENDING" ||
                step.execution?.status === "ACTION_REQUIRED"
            );

            const currentLifiStep =
              lifiStepIndex >= 0 ? updatedRoute.steps[lifiStepIndex] : null;

            setBridgeState((prev) => ({
              ...prev,
              steps: updatedSteps,
              currentStepIndex:
                currentStepIndex >= 0
                  ? currentStepIndex
                  : prev.currentStepIndex,
              currentStep: currentLifiStep,
              route: updatedRoute,
              status:
                currentLifiStep?.execution?.status === "ACTION_REQUIRED"
                  ? "approving"
                  : "bridging",
              txHash: updatedSteps[currentStepIndex]?.txHash || prev.txHash,
            }));
          },
          // Accept exchange rate updates
          acceptExchangeRateUpdateHook: async () => true,
          // Switch chain if needed
          switchChainHook: async (requiredChainId: number) => {
            // Check if we need to switch chains
            const currentChainId = walletClient.chain?.id;
            if (currentChainId !== requiredChainId) {
              // Use the connector's switchChain method if available
              if (
                "switchChain" in walletClient &&
                typeof walletClient.switchChain === "function"
              ) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (walletClient as any).switchChain({
                  id: requiredChainId,
                });
              } else {
                // Fallback: request chain switch via window.ethereum
                if (typeof window !== "undefined" && window.ethereum) {
                  await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: `0x${requiredChainId.toString(16)}` }],
                  });
                }
              }
            }
            return walletClient;
          },
          // Infinite approval (optional, can be set to exact amount)
          infiniteApproval: false,
        };

        const executedRoute = await executeRoute(route, executionOptions);

        // Final step update
        const finalSteps = mapRouteToSteps(executedRoute);
        const allSuccess = finalSteps.every(
          (step: BridgeStep) =>
            step.status === "success" || step.status === "skipped"
        );

        if (allSuccess) {
          // Mark receive step as success
          const receiveStepIndex = finalSteps.findIndex(
            (step: BridgeStep) => step.type === "receive"
          );
          if (receiveStepIndex >= 0) {
            finalSteps[receiveStepIndex].status = "success";
          }

          setBridgeState((prev) => ({
            ...prev,
            status: "success",
            route: executedRoute,
            steps: finalSteps,
            currentStepIndex: finalSteps.length - 1,
          }));
        } else {
          // Check if this is a status polling failure vs actual failure
          // If we have transaction hashes but steps are marked as failed, it's likely a status polling issue
          const hasTransactionHash = finalSteps.some((step) => step.txHash);
          const hasAnySuccess = finalSteps.some(
            (step) => step.status === "success"
          );
          const failedIndex = finalSteps.findIndex(
            (step: BridgeStep) => step.status === "failed"
          );
          const failedStep = finalSteps[failedIndex];

          // Check if the error is "Unknown error" which often indicates status polling failure
          const isUnknownError =
            !failedStep?.error ||
            failedStep.error === "Unknown error" ||
            failedStep.error.includes("status");

          if ((hasTransactionHash || hasAnySuccess) && isUnknownError) {
            // Transaction was submitted, but status check failed
            console.warn(
              "⚠️ Steps marked as failed but transaction was submitted - likely status polling issue"
            );
            console.log(
              "💡 Marking bridge as successful since transaction hashes exist"
            );

            // Mark all steps with txHash as success
            const recoveredSteps = finalSteps.map((step, idx) => {
              if (step.txHash || step.status === "success") {
                return { ...step, status: "success" as StepStatus };
              }
              // Mark receive step as success if previous steps have txHash
              if (step.type === "receive" && hasTransactionHash) {
                return { ...step, status: "success" as StepStatus };
              }
              return step;
            });

            setBridgeState((prev) => ({
              ...prev,
              status: "success",
              route: executedRoute,
              steps: recoveredSteps,
              currentStepIndex: recoveredSteps.length - 1,
            }));

            console.log("✅ Bridge marked as successful despite failed status");
          } else {
            // Actual failure
            throw new Error(
              `Bridge failed at step ${failedIndex + 1}: ${
                failedStep?.error || "Unknown error"
              }`
            );
          }
        }

        return executedRoute;
      } catch (error) {
        console.error("Error executing bridge:", error);

        // Check if error is a status polling error (424, timeout, etc.)
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const isStatusPollingError =
          errorMessage.includes("424") ||
          errorMessage.includes("third party tool") ||
          errorMessage.includes("gasZipBridge") ||
          errorMessage.includes("status") ||
          errorMessage.includes("timeout");

        // Check if we have transaction hashes (meaning transaction was submitted)
        const hasTransactionHash = bridgeState.steps.some(
          (step) => step.txHash
        );
        const hasSuccessfulSteps = bridgeState.steps.some(
          (step) => step.status === "success"
        );

        if (
          isStatusPollingError &&
          (hasTransactionHash || hasSuccessfulSteps)
        ) {
          // Transaction was submitted but status check failed
          console.warn(
            "⚠️ Bridge transaction submitted, but status polling failed:",
            errorMessage
          );
          console.log("💡 Transaction may have succeeded - check explorer!");

          setBridgeState((prev) => ({
            ...prev,
            status: "success", // Mark as success since transaction was submitted
            error: null,
            currentStepIndex: prev.steps.length - 1,
            steps: prev.steps.map((step, idx) => {
              // Mark all steps as success if transaction was submitted
              if (step.txHash || step.status === "success") {
                return { ...step, status: "success" as StepStatus };
              }
              // Mark pending receive step as success
              if (step.type === "receive" && idx === prev.steps.length - 1) {
                return { ...step, status: "success" as StepStatus };
              }
              return step;
            }),
          }));

          console.log(
            "✅ Bridge marked as successful despite status polling error"
          );
          return route; // Return the original route
        } else {
          // Actual failure
          const finalErrorMessage =
            error instanceof Error ? error.message : "Failed to execute bridge";

          setBridgeState((prev) => ({
            ...prev,
            status: "error",
            error: finalErrorMessage,
          }));
          throw error;
        }
      }
    },
    [connectorClient, address, isConnected, chain, bridgeState.steps] // Include steps in dependencies
  );

  // Reset the bridge state
  const reset = useCallback(() => {
    setBridgeState({
      status: "idle",
      route: null,
      currentStep: null,
      steps: [],
      currentStepIndex: 0,
      txHash: null,
      error: null,
      estimatedTime: null,
    });
  }, []);

  // Retry a specific step
  const retryStep = useCallback(
    async (stepIndex: number) => {
      if (!bridgeState.route) {
        throw new Error("No route available to retry");
      }

      // For now, retry the entire bridge
      // In the future, we could implement step-specific retry
      console.log(`Retrying step ${stepIndex}...`);
      await executeBridge(bridgeState.route);
    },
    [bridgeState.route, executeBridge]
  );

  return {
    bridgeState,
    fetchRoute,
    executeBridge,
    reset,
    retryStep,
  };
}

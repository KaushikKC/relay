import { useState, useCallback } from "react";
import { getRoutes, executeRoute } from "@lifi/sdk";
import type {
  Route,
  RouteExtended,
  RoutesRequest,
  ExecutionOptions,
} from "@lifi/sdk";
import {
  useAccount,
  useConnectorClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { createPublicClient, http } from "viem";
import { arbitrum } from "viem/chains";
import {
  setLiFiWalletClient,
  CHAIN_IDS,
  type DestinationType,
} from "@/lib/config/lifi";
import {
  getBridgeAddresses,
  ERC20_ABI,
  USDC_DECIMALS,
  ARBITRUM_MAINNET,
} from "@/lib/utils/hyperliquid-bridge";

export type HyperliquidDepositStatus =
  | "idle"
  | "fetching-route"
  | "route-ready"
  | "approving-source"
  | "bridging-to-arbitrum"
  | "waiting-for-arbitrum"
  | "depositing-to-hyperliquid"
  | "success"
  | "error";

export type HLStepStatus =
  | "pending"
  | "in-progress"
  | "success"
  | "failed"
  | "skipped";

export interface HyperliquidStep {
  stepIndex: number;
  type:
    | "approval"
    | "swap"
    | "bridge-to-arbitrum"
    | "wait-arbitrum"
    | "deposit-hyperliquid"
    | "complete";
  title: string;
  description: string;
  status: HLStepStatus;
  txHash?: string;
  chainId?: number;
  explorerUrl?: string;
  canRetry: boolean;
  error?: string;
  estimatedTime?: number;
}

export interface HyperliquidDepositState {
  status: HyperliquidDepositStatus;
  destinationType: DestinationType;
  route: Route | null;
  gasRoute: Route | null; // Route for bridging gas ETH to Arbitrum
  steps: HyperliquidStep[];
  currentStepIndex: number;
  txHash: string | null;
  depositTxHash: string | null;
  error: string | null;
  estimatedTime: number | null;
  arbitrumUsdcBalance: string | null;
  arbitrumEthBalance: string | null; // Track ETH balance on Arbitrum
  needsGasBridge: boolean; // Whether we need to bridge ETH for gas
  gasAmountUsd: string; // Gas reserve amount in USD
}

// Gas reserve amount in USD (enough for ~2-3 transactions on Arbitrum)
const GAS_RESERVE_USD = "0.50"; // $0.50 worth of ETH
const MIN_ETH_FOR_GAS = "0.00003"; // Minimum ETH needed for gas

const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io/tx/",
  42161: "https://arbiscan.io/tx/",
  8453: "https://basescan.org/tx/",
  10: "https://optimistic.etherscan.io/tx/",
  137: "https://polygonscan.com/tx/",
  56: "https://bscscan.com/tx/",
  999: "https://explorer.hyperliquid-testnet.xyz/tx/",
};

function getExplorerUrl(chainId: number, txHash?: string): string | undefined {
  if (!txHash) return undefined;
  return EXPLORER_URLS[chainId]
    ? `${EXPLORER_URLS[chainId]}${txHash}`
    : undefined;
}

export function useHyperliquidDeposit() {
  const { address, isConnected, chain } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const { data: walletClientForWrites } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  const [depositState, setDepositState] = useState<HyperliquidDepositState>({
    status: "idle",
    destinationType: "hyperliquid",
    route: null,
    gasRoute: null,
    steps: [],
    currentStepIndex: 0,
    txHash: null,
    depositTxHash: null,
    error: null,
    estimatedTime: null,
    arbitrumUsdcBalance: null,
    arbitrumEthBalance: null,
    needsGasBridge: false,
    gasAmountUsd: GAS_RESERVE_USD,
  });

  // Initialize steps for Hyperliquid deposit flow
  const initializeHyperliquidSteps = useCallback(
    (
      route: RouteExtended,
      needsGasBridge: boolean = false
    ): HyperliquidStep[] => {
      const steps: HyperliquidStep[] = [];
      let stepIndex = 0;

      // Step 0: Bridge gas ETH (if needed)
      if (needsGasBridge) {
        steps.push({
          stepIndex: stepIndex++,
          type: "bridge-to-arbitrum",
          title: "Bridging Gas to Arbitrum",
          description: `Sending ~$${GAS_RESERVE_USD} ETH for gas fees`,
          status: "pending",
          chainId: route.fromChainId,
          canRetry: true,
          estimatedTime: 90,
        });
      }

      // Add LI.FI bridge steps for USDC
      route.steps.forEach((lifiStep) => {
        // Check for approval step - check action structure and tool name
        const action = (lifiStep as RouteExtended["steps"][0]).action;
        const actionType = (action as { type?: string })?.type;
        const toolName = lifiStep.toolDetails?.name?.toLowerCase() || "";

        // Approval step - check action type or tool name
        if (actionType === "approval" || toolName.includes("approval")) {
          steps.push({
            stepIndex: stepIndex++,
            type: "approval",
            title: "Approving Token",
            description: `Approve ${lifiStep.action.fromToken.symbol} for bridging`,
            status: "pending",
            chainId: lifiStep.action.fromChainId,
            canRetry: true,
            estimatedTime: 30,
          });
        }

        // Swap step
        if (
          actionType === "swap" ||
          toolName.includes("swap") ||
          (lifiStep.action.fromChainId === lifiStep.action.toChainId &&
            lifiStep.action.fromToken.address !==
              lifiStep.action.toToken.address)
        ) {
          steps.push({
            stepIndex: stepIndex++,
            type: "swap",
            title: "Swapping on Source Chain",
            description: `${lifiStep.action.fromToken.symbol} → ${lifiStep.action.toToken.symbol}`,
            status: "pending",
            chainId: lifiStep.action.fromChainId,
            canRetry: true,
            estimatedTime: 60,
          });
        }

        // Bridge step (to Arbitrum)
        if (
          actionType === "cross" ||
          actionType === "bridge" ||
          actionType === "lifi" ||
          toolName.includes("bridge") ||
          lifiStep.action.fromChainId !== lifiStep.action.toChainId
        ) {
          steps.push({
            stepIndex: stepIndex++,
            type: "bridge-to-arbitrum",
            title: "Bridging USDC to Arbitrum",
            description: `Moving USDC to Arbitrum network`,
            status: "pending",
            chainId: lifiStep.action.fromChainId,
            canRetry: true,
            estimatedTime: 120,
          });
        }
      });

      // Waiting for funds on Arbitrum
      steps.push({
        stepIndex: stepIndex++,
        type: "wait-arbitrum",
        title: "Receiving on Arbitrum",
        description: "Waiting for USDC to arrive on Arbitrum",
        status: "pending",
        chainId: CHAIN_IDS.ARBITRUM,
        canRetry: false,
        estimatedTime: 60,
      });

      // Deposit to Hyperliquid (simple transfer - no approval needed)
      // Per Hyperliquid docs: "The user sends native USDC to the bridge"
      steps.push({
        stepIndex: stepIndex++,
        type: "deposit-hyperliquid",
        title: "Depositing to Hyperliquid",
        description: "Transferring USDC to Hyperliquid Bridge",
        status: "pending",
        chainId: CHAIN_IDS.ARBITRUM,
        canRetry: true,
        estimatedTime: 30,
      });

      // Complete
      steps.push({
        stepIndex: stepIndex++,
        type: "complete",
        title: "Deposit Complete",
        description: "Funds available in Hyperliquid Exchange",
        status: "pending",
        canRetry: false,
      });

      return steps;
    },
    []
  );

  // Update step status helper
  const updateStepStatus = useCallback(
    (
      stepIndex: number,
      status: HLStepStatus,
      txHash?: string,
      error?: string
    ) => {
      setDepositState((prev) => {
        const newSteps = [...prev.steps];
        if (newSteps[stepIndex]) {
          newSteps[stepIndex] = {
            ...newSteps[stepIndex],
            status,
            txHash,
            explorerUrl: txHash
              ? getExplorerUrl(newSteps[stepIndex].chainId || 42161, txHash)
              : undefined,
            error,
          };
        }
        return {
          ...prev,
          steps: newSteps,
          currentStepIndex: stepIndex,
        };
      });
    },
    []
  );

  // Note: ETH balance check is now done inline in fetchHyperliquidRoute
  // using a dedicated Arbitrum publicClient for better reliability

  // Fetch route for bridging to Arbitrum
  const fetchRoute = useCallback(
    async (options: {
      fromChainId: number;
      fromTokenAddress: string;
      fromAmount: string;
      fromAddress: string;
    }) => {
      try {
        setDepositState((prev) => ({
          ...prev,
          status: "fetching-route",
          error: null,
        }));

        const { usdc } = getBridgeAddresses(ARBITRUM_MAINNET);

        // Check if user already has ETH on Arbitrum for gas
        let needsGasBridge = true;
        let gasRoute: Route | null = null;
        let arbitrumEthBalance = "0";

        // Create Arbitrum publicClient to check balance
        const arbitrumPublicClient = createPublicClient({
          chain: arbitrum,
          transport: http(),
        });

        try {
          // Always check Arbitrum ETH balance first (regardless of source chain)
          console.log("🔍 Checking ETH balance on Arbitrum...");
          const ethBalance = await arbitrumPublicClient.getBalance({
            address: options.fromAddress as `0x${string}`,
          });
          arbitrumEthBalance = ethBalance ? ethBalance.toString() : "0";

          // Convert to ETH
          const ethBalanceInEth = Number(ethBalance) / 1e18;
          console.log(
            `💰 Current Arbitrum ETH balance: ${ethBalanceInEth.toFixed(6)} ETH`
          );

          // Only bridge gas if balance is below threshold (0.00003 ETH)
          needsGasBridge = ethBalanceInEth < parseFloat(MIN_ETH_FOR_GAS);

          if (!needsGasBridge) {
            console.log(
              `✅ User has sufficient ETH on Arbitrum (${ethBalanceInEth.toFixed(
                6
              )} ETH). Skipping gas bridge.`
            );
          } else {
            console.log(
              `⚠️ Insufficient ETH on Arbitrum (${ethBalanceInEth.toFixed(
                6
              )} ETH < ${MIN_ETH_FOR_GAS} ETH). Will bridge gas.`
            );
          }
        } catch (balanceError) {
          console.warn("Could not check Arbitrum ETH balance:", balanceError);
          // If we can't check, assume we need gas (safe fallback)
          needsGasBridge = true;
        }

        // If not on Arbitrum AND needs gas, fetch gas route
        if (needsGasBridge && options.fromChainId !== CHAIN_IDS.ARBITRUM) {
          console.log("📊 Fetching gas bridge route...");

          // Calculate gas amount: ~$0.50 worth
          // Assuming ETH price ~$2500, that's about 0.0002 ETH
          const gasAmountWei = "200000000000000"; // 0.0002 ETH in wei

          try {
            const gasRouteRequest: RoutesRequest = {
              fromChainId: options.fromChainId,
              toChainId: CHAIN_IDS.ARBITRUM,
              fromTokenAddress: options.fromTokenAddress, // Use same source token
              toTokenAddress: "0x0000000000000000000000000000000000000000", // Native ETH on Arbitrum
              fromAmount: gasAmountWei,
              fromAddress: options.fromAddress,
              toAddress: options.fromAddress,
              options: {
                slippage: 0.05, // Higher slippage for small amounts
                order: "CHEAPEST" as const,
              },
            };

            const gasResult = await getRoutes(gasRouteRequest);
            if (gasResult.routes && gasResult.routes.length > 0) {
              gasRoute = gasResult.routes[0];
              console.log("Gas route found:", gasRoute.id);
            } else {
              console.warn(
                "No gas route found, user will need ETH on Arbitrum"
              );
              needsGasBridge = false; // Proceed without gas bridge
            }
          } catch (gasError) {
            console.warn("Could not fetch gas route:", gasError);
            needsGasBridge = false; // Proceed without gas bridge
          }
        }

        // Fetch main USDC route
        const routeRequest: RoutesRequest = {
          fromChainId: options.fromChainId,
          toChainId: CHAIN_IDS.ARBITRUM,
          fromTokenAddress: options.fromTokenAddress,
          toTokenAddress: usdc, // USDC on Arbitrum
          fromAmount: options.fromAmount,
          fromAddress: options.fromAddress,
          toAddress: options.fromAddress,
          options: {
            slippage: 0.03,
            order: "RECOMMENDED" as const,
          },
        };

        const result = await getRoutes(routeRequest);

        if (result.routes && result.routes.length > 0) {
          const bestRoute = result.routes[0];
          const initialSteps = initializeHyperliquidSteps(
            bestRoute as RouteExtended,
            needsGasBridge && gasRoute !== null
          );

          const extraTime = needsGasBridge && gasRoute ? 120 : 0; // Extra time for gas bridge

          setDepositState((prev) => ({
            ...prev,
            status: "route-ready",
            route: bestRoute,
            gasRoute: gasRoute,
            steps: initialSteps,
            currentStepIndex: 0,
            needsGasBridge: needsGasBridge && gasRoute !== null,
            arbitrumEthBalance,
            estimatedTime:
              bestRoute.steps.reduce(
                (acc, step) => acc + (step.estimate.executionDuration || 0),
                0
              ) +
              150 +
              extraTime,
          }));

          return bestRoute;
        } else {
          throw new Error("No routes found to Arbitrum");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch route";
        setDepositState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }));
        throw error;
      }
    },
    [initializeHyperliquidSteps]
  );

  // Execute the full Hyperliquid deposit flow
  const executeDeposit = useCallback(
    async (route: Route) => {
      console.log("Starting Hyperliquid deposit execution:", {
        isConnected,
        hasAddress: !!address,
        hasConnectorClient: !!connectorClient,
        chainId: chain?.id,
        needsGasBridge: depositState.needsGasBridge,
        hasGasRoute: !!depositState.gasRoute,
      });

      if (!isConnected || !address) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first."
        );
      }

      // Get wallet client from connector
      let walletClient = connectorClient;

      if (!walletClient) {
        // Wait a bit for connector client to initialize
        console.warn(
          "Wallet client not ready, waiting for connector to initialize..."
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (!connectorClient) {
          throw new Error(
            "Wallet client not available. Please:\n" +
              "1. Ensure your wallet is connected and unlocked\n" +
              "2. Try refreshing the page\n" +
              "3. If the issue persists, disconnect and reconnect your wallet"
          );
        }
        walletClient = connectorClient;
      }

      const { bridge, usdc } = getBridgeAddresses(ARBITRUM_MAINNET);

      try {
        // Set wallet client for LI.FI
        // walletClient is already typed as WalletClient from wagmi
        // setLiFiWalletClient expects a specific type, so we cast it
        setLiFiWalletClient(
          walletClient as Parameters<typeof setLiFiWalletClient>[0]
        );
        console.log("Wallet client set for LI.FI SDK");

        let currentStepIdx = 0;

        // Step 1: Execute gas bridge first (if needed)
        if (depositState.needsGasBridge && depositState.gasRoute) {
          console.log("Executing gas bridge to Arbitrum...");

          setDepositState((prev) => ({
            ...prev,
            status: "bridging-to-arbitrum",
            error: null,
          }));

          // Update step to in-progress
          updateStepStatus(currentStepIdx, "in-progress");

          const gasExecutionOptions: ExecutionOptions = {
            updateRouteHook: (updatedRoute: RouteExtended) => {
              const lastStep =
                updatedRoute.steps[updatedRoute.steps.length - 1];
              const txHash = lastStep?.execution?.process?.[0]?.txHash;
              if (txHash) {
                updateStepStatus(currentStepIdx, "in-progress", txHash);
              }
            },
            acceptExchangeRateUpdateHook: async () => true,
            switchChainHook: async (requiredChainId: number) => {
              if (chain?.id !== requiredChainId) {
                await switchChainAsync({ chainId: requiredChainId });
              }
              return walletClient;
            },
            infiniteApproval: false,
          };

          try {
            await executeRoute(depositState.gasRoute, gasExecutionOptions);
            updateStepStatus(currentStepIdx, "success");
            console.log("✅ Gas bridge completed successfully!");
            currentStepIdx++;

            // Wait a moment for gas to be available on Arbitrum
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // IMPORTANT: Switch back to source chain for main bridge
            // The gas bridge switched us to Arbitrum, but the main USDC bridge
            // also needs to start from the source chain
            const sourceChainId = route.fromChainId;
            const currentChainId = chain?.id;

            if (currentChainId !== sourceChainId) {
              console.log(
                `🔄 Switching back to source chain ${sourceChainId} from ${currentChainId} for main bridge`
              );
              try {
                await switchChainAsync({ chainId: sourceChainId });
                console.log(`✅ Switched back to chain ${sourceChainId}`);
                // Wait for chain switch to complete
                await new Promise((resolve) => setTimeout(resolve, 1500));
              } catch (switchError) {
                console.error(
                  "Failed to switch back to source chain:",
                  switchError
                );
                // Continue anyway - the switchChainHook will handle it during execution
              }
            }
          } catch (gasError) {
            console.error("❌ Gas bridge failed:", gasError);
            updateStepStatus(
              currentStepIdx,
              "failed",
              undefined,
              "Gas bridge failed"
            );
            throw new Error(
              "Failed to bridge gas ETH to Arbitrum. Please try again."
            );
          }
        }

        // Step 2: Execute main USDC bridge
        console.log("🔥 Executing main USDC bridge to Arbitrum...");

        setDepositState((prev) => ({
          ...prev,
          status: "bridging-to-arbitrum",
          error: null,
        }));

        // Find the USDC bridge step index
        const bridgeStepIndex = depositState.steps.findIndex(
          (s, idx) => s.type === "bridge-to-arbitrum" && idx >= currentStepIdx
        );

        // Execute LI.FI bridge to Arbitrum
        const executionOptions: ExecutionOptions = {
          updateRouteHook: (updatedRoute: RouteExtended) => {
            // Update corresponding step
            updatedRoute.steps.forEach((lifiStep, idx) => {
              // Type-safe access to execution
              const execution = (lifiStep as RouteExtended["steps"][0])
                .execution;
              if (execution) {
                // Type-safe access to process and txHash
                const process = execution.process as
                  | Array<{ txHash?: string }>
                  | undefined;
                const txHash = process?.[0]?.txHash;
                let status: HLStepStatus = "pending";
                if (execution.status === "DONE") status = "success";
                else if (execution.status === "FAILED") status = "failed";
                else if (
                  execution.status === "PENDING" ||
                  execution.status === "ACTION_REQUIRED"
                )
                  status = "in-progress";

                // Map LI.FI step index to our step index
                const ourStepIndex = idx < bridgeStepIndex ? idx : idx;
                if (ourStepIndex < depositState.steps.length) {
                  updateStepStatus(ourStepIndex, status, txHash);
                }
              }
            });

            setDepositState((prev) => {
              // Type-safe access to txHash
              const firstStep = updatedRoute.steps[0];
              const execution = firstStep?.execution;
              const process = execution?.process as
                | Array<{ txHash?: string }>
                | undefined;
              const txHash = process?.[0]?.txHash || prev.txHash;

              return {
                ...prev,
                route: updatedRoute,
                txHash,
              };
            });
          },
          acceptExchangeRateUpdateHook: async () => true,
          switchChainHook: async (requiredChainId: number) => {
            if (chain?.id !== requiredChainId) {
              await switchChainAsync({ chainId: requiredChainId });
            }
            return walletClient;
          },
          infiniteApproval: false,
        };

        // Execute bridge to Arbitrum
        const executedRoute = await executeRoute(route, executionOptions);

        // Mark bridge steps as complete
        const waitStepIndex = depositState.steps.findIndex(
          (s) => s.type === "wait-arbitrum"
        );
        updateStepStatus(waitStepIndex, "success");

        setDepositState((prev) => ({
          ...prev,
          status: "waiting-for-arbitrum",
          route: executedRoute,
        }));

        // Wait longer for the funds to be available on Arbitrum
        console.log("⏳ Waiting for funds to arrive on Arbitrum...");
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Increased to 10 seconds

        // Switch to Arbitrum if needed
        if (chain?.id !== CHAIN_IDS.ARBITRUM) {
          console.log("🔄 Switching to Arbitrum...");
          await switchChainAsync({ chainId: CHAIN_IDS.ARBITRUM });
          // Wait for switch to complete
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Create Arbitrum-specific publicClient for reliable reads
        const arbitrumPublicClient = createPublicClient({
          chain: arbitrum,
          transport: http(),
        });

        // Check USDC balance on Arbitrum using Arbitrum RPC
        console.log("🔍 Checking USDC balance on Arbitrum...");
        const balanceResult = await arbitrumPublicClient.readContract({
          address: usdc as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        });

        const usdcBalance = balanceResult as bigint;
        const usdcBalanceFormatted = (
          Number(usdcBalance) /
          10 ** USDC_DECIMALS
        ).toFixed(2);
        console.log(
          `✅ USDC balance on Arbitrum: ${usdcBalanceFormatted} USDC (${usdcBalance.toString()} wei)`
        );

        if (usdcBalance <= BigInt(0)) {
          throw new Error(
            `No USDC balance detected on Arbitrum. Bridge may still be processing. Please wait a moment and try again.`
          );
        }

        // ⭐ Validate minimum deposit (5 USDC) - per Hyperliquid docs
        const MIN_DEPOSIT_AMOUNT = BigInt(5 * 10 ** USDC_DECIMALS); // 5 USDC in wei
        if (usdcBalance < MIN_DEPOSIT_AMOUNT) {
          throw new Error(
            `Minimum deposit is 5 USDC. Your amount: ${usdcBalanceFormatted} USDC. Amounts below 5 USDC will not be credited and may be lost forever.`
          );
        }

        // ⭐ IMPORTANT: Bridge2 does NOT have a deposit() function!
        // Per the official docs and contract:
        // "The user sends native USDC to the bridge, and it is credited to the account that sent it"
        // "The validators on the L1 listen for Transfer events to this contract"
        //
        // So the deposit flow is simply: usdc.transfer(bridgeAddress, amount)
        // No approval needed, no deposit function call - just a direct transfer!

        // Step: Transfer USDC to Hyperliquid Bridge
        setDepositState((prev) => ({
          ...prev,
          status: "depositing-to-hyperliquid",
          arbitrumUsdcBalance: usdcBalanceFormatted,
        }));

        const depositStepIndex = depositState.steps.findIndex(
          (s) => s.type === "deposit-hyperliquid"
        );
        updateStepStatus(depositStepIndex, "in-progress");

        if (!walletClientForWrites) {
          throw new Error("Wallet client not available for deposit");
        }

        console.log("🚀 Depositing USDC to Hyperliquid Bridge...");
        console.log(`   Bridge: ${bridge}`);
        console.log(`   From: ${address}`);
        console.log(
          `   Amount: ${usdcBalance.toString()} (${usdcBalanceFormatted} USDC)`
        );
        console.log(`   Current chain: ${chain?.id}`);

        // ⭐ CORRECT FLOW: Simply transfer USDC to the bridge contract
        // The validators watch for these transfers and credit the user's L1 account
        console.log("📤 Transferring USDC to bridge contract...");
        const depositTxHash = await walletClientForWrites.writeContract({
          address: usdc as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [bridge as `0x${string}`, usdcBalance],
          account: address,
          chain: arbitrum, // ⭐ Explicitly use Arbitrum chain
        });

        console.log(`✅ Deposit transaction sent: ${depositTxHash}`);
        updateStepStatus(depositStepIndex, "success", depositTxHash);

        // Wait for deposit confirmation using Arbitrum RPC
        console.log("⏳ Waiting for deposit confirmation...");
        await arbitrumPublicClient.waitForTransactionReceipt({
          hash: depositTxHash,
        });
        console.log(
          "✅ Deposit confirmed! Funds will arrive on Hyperliquid in ~1 minute."
        );

        // Mark complete
        const completeStepIndex = depositState.steps.findIndex(
          (s) => s.type === "complete"
        );
        updateStepStatus(completeStepIndex, "success");

        setDepositState((prev) => ({
          ...prev,
          status: "success",
          depositTxHash,
        }));

        return { bridgeRoute: executedRoute, depositTxHash };
      } catch (error) {
        console.error("Error in Hyperliquid deposit flow:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Deposit failed";

        // Find the current step that failed
        const currentStep = depositState.steps.find(
          (s) => s.status === "in-progress"
        );
        if (currentStep) {
          updateStepStatus(
            currentStep.stepIndex,
            "failed",
            undefined,
            errorMessage
          );
        }

        setDepositState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }));
        throw error;
      }
    },
    [
      isConnected,
      address,
      connectorClient,
      walletClientForWrites,
      chain,
      switchChainAsync,
      depositState.steps,
      depositState.needsGasBridge,
      depositState.gasRoute,
      updateStepStatus,
    ]
  );

  // Reset state
  const reset = useCallback(() => {
    setDepositState({
      status: "idle",
      destinationType: "hyperliquid",
      route: null,
      gasRoute: null,
      steps: [],
      currentStepIndex: 0,
      txHash: null,
      depositTxHash: null,
      error: null,
      estimatedTime: null,
      arbitrumUsdcBalance: null,
      arbitrumEthBalance: null,
      needsGasBridge: false,
      gasAmountUsd: GAS_RESERVE_USD,
    });
  }, []);

  // Retry from a specific step
  const retryStep = useCallback(
    async (stepIndex: number) => {
      const step = depositState.steps[stepIndex];
      if (!step || !depositState.route) return;

      // For now, retry from the beginning of the failed phase
      if (step.type === "deposit-hyperliquid") {
        // Re-execute the deposit step
        await executeDeposit(depositState.route);
      } else {
        // Re-execute the entire flow
        await executeDeposit(depositState.route);
      }
    },
    [depositState.route, depositState.steps, executeDeposit]
  );

  return {
    depositState,
    fetchRoute,
    executeDeposit,
    reset,
    retryStep,
  };
}

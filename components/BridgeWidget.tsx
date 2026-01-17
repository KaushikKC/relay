"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Button from "./Button";
import ErrorRecovery from "./ErrorRecovery";
import BridgeProgress from "./BridgeProgress";
import ResumeBridgeDialog from "./ResumeBridgeDialog";
import PartialFailureRecovery from "./PartialFailureRecovery";
import MobileWalletConnect from "./MobileWalletConnect";
import DepositToHyperliquid from "./DepositToHyperliquid";
import PostBridgeDashboard from "./PostBridgeDashboard"; // NEW
import { useSwipeGesture, useIsMobile } from "@/lib/hooks/useSwipeGesture";
import { useLiFiBridge } from "@/lib/hooks/useLiFiBridge";
import { useTokenBalance } from "@/lib/hooks/useTokenBalance";
import {
  getSupportedChains,
  getFeaturedTokens,
  getTokensForChain,
  parseTokenAmount,
  formatTokenAmount,
} from "@/lib/utils/lifi-helpers";
import { checkLiFiChains } from "@/lib/utils/check-lifi-chains";
import {
  saveBridgeState,
  loadBridgeState,
  clearBridgeState,
  saveDetailedBridgeState,
  detectPartialFailure,
  hasPendingTransaction,
  type PersistedBridgeState,
} from "@/lib/utils/transactionPersistence";
import { CHAIN_IDS, type DestinationType } from "@/lib/config/lifi";
import { useHyperliquidDeposit } from "@/lib/hooks/useHyperliquidDeposit";
import type { Chain, Token, RouteExtended } from "@lifi/sdk";

export default function BridgeWidget() {
  const { address, isConnected } = useAccount();
  const { bridgeState, fetchRoute, executeBridge, reset, retryStep } =
    useLiFiBridge();
  const {
    depositState: hyperliquidState,
    fetchRoute: fetchHyperliquidRoute,
    executeDeposit: executeHyperliquidDeposit,
    reset: resetHyperliquid,
    retryStep: retryHyperliquidStep,
  } = useHyperliquidDeposit();

  // Destination type state
  const [destinationType, setDestinationType] =
    useState<DestinationType>("hyperliquid");

  // UI State
  const [chains, setChains] = useState<Chain[]>([]);
  const [fromChainId, setFromChainId] = useState<number>(1); // Ethereum default
  // Dynamic toChainId based on destination type
  const toChainId =
    destinationType === "hyperliquid" ? CHAIN_IDS.ARBITRUM : CHAIN_IDS.HYPEREVM;
  const [fromTokens, setFromTokens] = useState<Token[]>([]);
  const [toTokens, setToTokens] = useState<Token[]>([]); // NEW: Destination tokens
  const [selectedFromToken, setSelectedFromToken] = useState<Token | null>(
    null
  );
  const [selectedToToken, setSelectedToToken] = useState<Token | null>(null); // NEW: Selected destination token
  const [amount, setAmount] = useState<string>("");
  const [autoDeposit, setAutoDeposit] = useState(false);
  const [isLoadingChains, setIsLoadingChains] = useState(true);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isLoadingToTokens, setIsLoadingToTokens] = useState(false);

  // Resume and partial failure state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedState, setSavedState] = useState<PersistedBridgeState | null>(
    null
  );
  const [partialFailure, setPartialFailure] = useState<
    PersistedBridgeState["partialSuccess"] | null
  >(null);

  // NEW: Deposit to Hyperliquid state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false); // NEW: PostBridgeDashboard

  // Mobile detection and swipe gestures
  const isMobile = useIsMobile();

  // Handle dismiss resume (defined before swipe handlers)
  const handleDismissResume = () => {
    clearBridgeState();
    setShowResumeDialog(false);
    setSavedState(null);
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      // Could navigate to next step or close modals
      if (showResumeDialog) {
        handleDismissResume();
      }
    },
    onSwipeRight: () => {
      // Could navigate back
    },
  });

  // Get balance for selected token
  const {
    balance,
    isLoading: isBalanceLoading,
    symbol,
  } = useTokenBalance(fromChainId, selectedFromToken?.address);

  // Load chains on mount
  useEffect(() => {
    const loadChains = async () => {
      setIsLoadingChains(true);

      // Check what chains LI.FI actually supports (including HyperEVM)
      await checkLiFiChains();

      const supportedChains = await getSupportedChains();
      setChains(supportedChains);
      setIsLoadingChains(false);
    };
    loadChains();
  }, []);

  // Load tokens when chain changes
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoadingTokens(true);
      console.log("=== Loading tokens for chain:", fromChainId, "===");

      try {
        const tokens = await getFeaturedTokens(fromChainId);
        console.log(
          "✓ Loaded tokens:",
          tokens.length,
          "tokens -",
          tokens
            .slice(0, 5)
            .map((t) => t.symbol)
            .join(", "),
          tokens.length > 5 ? "..." : ""
        );

        if (!Array.isArray(tokens)) {
          console.error("ERROR: tokens is not an array:", tokens);
          setFromTokens([]);
          return;
        }

        setFromTokens(tokens);

        // Select first token (usually ETH/native token) by default
        if (tokens.length > 0) {
          setSelectedFromToken(tokens[0]);
          console.log("✓ Selected default token:", tokens[0].symbol);
        } else {
          console.warn("⚠ No tokens available for chain:", fromChainId);
          setFromTokens([]);
        }
      } catch (error) {
        console.error("✗ Error loading tokens:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        setFromTokens([]);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    if (fromChainId) {
      loadTokens();
    }
  }, [fromChainId]);

  // Load destination tokens (HyperEVM) on mount
  useEffect(() => {
    const loadToTokens = async () => {
      setIsLoadingToTokens(true);
      console.log(
        `=== Loading destination tokens for HyperEVM (chain ${toChainId}) ===`
      );

      try {
        // First try to get tokens from LI.FI
        const allTokens = await getTokensForChain(toChainId);
        console.log(`✓ Got ${allTokens.length} tokens from LI.FI for HyperEVM`);

        // Filter for popular tokens on HyperEVM (USDC, HYPE, ETH, WETH)
        const popularSymbols = ["USDC", "HYPE", "ETH", "WETH"];
        const featured = allTokens.filter((token) =>
          popularSymbols.includes(token.symbol.toUpperCase())
        );

        console.log(
          `✓ Found ${featured.length} featured tokens:`,
          featured.map((t) => t.symbol)
        );

        // If LI.FI has tokens, use them
        if (allTokens.length > 0) {
          // Prefer featured tokens, but fall back to all tokens if no featured ones
          const displayTokens =
            featured.length > 0 ? featured : allTokens.slice(0, 10);
          setToTokens(displayTokens);

          // Auto-select first token (prefer USDC if available)
          const usdcToken = displayTokens.find(
            (t) => t.symbol.toUpperCase() === "USDC"
          );
          const ethToken = displayTokens.find(
            (t) =>
              t.symbol.toUpperCase() === "ETH" ||
              t.symbol.toUpperCase() === "WETH"
          );
          const tokenToSelect =
            usdcToken || ethToken || displayTokens[0] || null;
          setSelectedToToken(tokenToSelect);

          console.log(
            `✓ Selected destination token:`,
            tokenToSelect?.symbol || "none"
          );
        } else {
          // Fallback: Use hardcoded tokens if LI.FI doesn't have HyperEVM tokens
          console.warn(
            "⚠️ LI.FI doesn't have tokens for HyperEVM, using fallback tokens"
          );
          const fallbackTokens: Token[] = [
            {
              address: "0x0000000000000000000000000000000000000000",
              symbol: "ETH",
              name: "Ethereum",
              decimals: 18,
              chainId: toChainId,
              priceUSD: "0",
              logoURI: "",
            } as Token,
          ];
          setToTokens(fallbackTokens);
          setSelectedToToken(fallbackTokens[0]);
          console.log("✓ Using fallback ETH token for HyperEVM");
        }
      } catch (error) {
        console.error("✗ Error loading destination tokens:", error);

        // Fallback on error
        const fallbackTokens: Token[] = [
          {
            address: "0x0000000000000000000000000000000000000000",
            symbol: "ETH",
            name: "Ethereum",
            decimals: 18,
            chainId: toChainId,
            priceUSD: "0",
            logoURI: "",
          } as Token,
        ];
        setToTokens(fallbackTokens);
        setSelectedToToken(fallbackTokens[0]);
        console.log("✓ Using fallback ETH token due to error");
      } finally {
        setIsLoadingToTokens(false);
      }
    };

    loadToTokens();
  }, [toChainId]);

  // Check for saved state on mount
  useEffect(() => {
    const saved = loadBridgeState();

    if (saved && hasPendingTransaction()) {
      setShowResumeDialog(true);
      setSavedState(saved);
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (bridgeState.status !== "idle" && address) {
      // If we have detailed state (route and steps), use saveDetailedBridgeState
      if (
        bridgeState.route &&
        bridgeState.steps.length > 0 &&
        (bridgeState.status === "executing" ||
          bridgeState.status === "bridging" ||
          bridgeState.status === "approving")
      ) {
        saveDetailedBridgeState(
          bridgeState.route as RouteExtended,
          bridgeState.steps,
          bridgeState.currentStepIndex
        );
      } else {
        // Otherwise use basic save
        saveBridgeState({
          fromChainId,
          toChainId,
          fromTokenAddress: selectedFromToken?.address || "",
          toTokenAddress: selectedToToken?.address || "",
          amount,
          txHash: bridgeState.txHash || undefined,
          status: bridgeState.status,
          timestamp: Date.now(),
          routeId: bridgeState.routeId,
          steps: bridgeState.steps,
          currentStepIndex: bridgeState.currentStepIndex,
        });
      }
    }
  }, [
    bridgeState,
    fromChainId,
    toChainId,
    selectedFromToken,
    selectedToToken,
    amount,
    address,
  ]);

  // Handle partial failures
  useEffect(() => {
    if (bridgeState.status === "error" && bridgeState.route) {
      const partial = detectPartialFailure(
        bridgeState.route as RouteExtended,
        bridgeState.steps || []
      );

      if (partial) {
        setPartialFailure(partial);
        // Save partial failure state
        const state = loadBridgeState();
        if (state) {
          saveBridgeState({
            ...state,
            partialSuccess: partial,
          });
        }
      }
    } else if (bridgeState.status === "success") {
      // Clear partial failure on success
      setPartialFailure(null);
      clearBridgeState();
    }
  }, [bridgeState.status, bridgeState.route, bridgeState.steps]);

  const handleMaxClick = () => {
    if (balance) {
      setAmount(balance);
    }
  };

  const handleGetQuote = async () => {
    if (!address || !selectedFromToken || !amount) {
      return;
    }

    // For Hyperliquid destination, we don't need a destination token selection
    // as it always goes to USDC on Arbitrum then to Hyperliquid
    if (destinationType === "hyperevm" && !selectedToToken) {
      alert("Please select a destination token (USDC, HYPE, or ETH)");
      return;
    }

    try {
      const amountInWei = parseTokenAmount(amount, selectedFromToken.decimals);

      if (destinationType === "hyperliquid") {
        // Use Hyperliquid deposit flow (bridges to Arbitrum USDC)
        await fetchHyperliquidRoute({
          fromChainId,
          fromTokenAddress: selectedFromToken.address,
          fromAmount: amountInWei,
          fromAddress: address,
        });
      } else {
        // Use regular HyperEVM bridge flow
        await fetchRoute({
          fromChainId,
          toChainId,
          fromTokenAddress: selectedFromToken.address,
          toTokenAddress: selectedToToken!.address,
          fromAmount: amountInWei,
          fromAddress: address,
        });
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
    }
  };

  const handleExecute = async () => {
    // Check wallet connection before executing
    if (!isConnected || !address) {
      console.error("Wallet not connected:", { isConnected, address });
      alert("Please connect your wallet first before executing the bridge.");
      return;
    }

    if (destinationType === "hyperliquid") {
      // Execute Hyperliquid deposit flow
      if (!hyperliquidState.route) return;

      console.log("Starting Hyperliquid deposit flow...", {
        routeId: hyperliquidState.route.id,
        fromChain: hyperliquidState.route.fromChainId,
        toChain: "Arbitrum -> Hyperliquid",
        address,
      });

      try {
        await executeHyperliquidDeposit(hyperliquidState.route);
      } catch (error) {
        console.error("Error executing Hyperliquid deposit:", error);
      }
    } else {
      // Execute regular HyperEVM bridge flow
      if (!bridgeState.route) return;

      console.log("Starting bridge execution...", {
        routeId: bridgeState.route.id,
        fromChain: bridgeState.route.fromChainId,
        toChain: bridgeState.route.toChainId,
        address,
      });

      // Save detailed state periodically during execution
      const interval = setInterval(() => {
        if (bridgeState.route && bridgeState.steps.length > 0) {
          saveDetailedBridgeState(
            bridgeState.route as RouteExtended,
            bridgeState.steps,
            bridgeState.currentStepIndex
          );
        }
      }, 2000);

      try {
        await executeBridge(bridgeState.route);

        // If auto-deposit is enabled and bridge successful, trigger deposit
        if (autoDeposit && bridgeState.status === "success") {
          console.log("Auto-deposit to Hyperliquid account");
        }
      } catch (error) {
        console.error("Error executing bridge:", error);
      } finally {
        clearInterval(interval);
      }
    }
  };

  // Handle resume bridge
  const handleResumeBridge = async () => {
    if (!savedState?.routeData) {
      console.error("No route data available to resume");
      setShowResumeDialog(false);
      return;
    }

    try {
      // Restore bridge state from saved route
      await executeBridge(savedState.routeData as RouteExtended);
      setShowResumeDialog(false);
    } catch (error) {
      console.error("Error resuming bridge:", error);
      alert("Failed to resume bridge. Please start a new bridge.");
      setShowResumeDialog(false);
    }
  };

  const handleReset = () => {
    reset();
    resetHyperliquid();
    setAmount("");
    clearBridgeState();
    setPartialFailure(null);
  };

  // Render resume dialog
  if (showResumeDialog && savedState) {
    return (
      <ResumeBridgeDialog
        savedState={savedState}
        onResume={handleResumeBridge}
        onDismiss={handleDismissResume}
      />
    );
  }

  // Render partial failure recovery
  if (partialFailure) {
    return (
      <div className="space-y-6">
        <PartialFailureRecovery
          partialFailure={partialFailure}
          onRetryBridge={() => {
            setPartialFailure(null);
            if (savedState?.routeData) {
              executeBridge(savedState.routeData as RouteExtended);
            }
          }}
          onViewFunds={() => {
            // Open explorer for the chain where funds are located
            const explorerUrls: Record<number, string> = {
              1: "https://etherscan.io",
              42161: "https://arbiscan.io",
              8453: "https://basescan.org",
              10: "https://optimistic.etherscan.io",
              137: "https://polygonscan.com",
              56: "https://bscscan.com",
              999: "https://explorer.hyperliquid-testnet.xyz",
            };
            const url =
              explorerUrls[partialFailure.fundsLocation.chainId] ||
              `https://explorer.hyperliquid-testnet.xyz`;
            window.open(url, "_blank");
          }}
        />
        <Button onClick={handleReset}>Start New Bridge</Button>
      </div>
    );
  }

  const handleRetry = () => {
    reset();
    // Keep the existing form values for retry
  };

  const handleResume = async () => {
    const savedState = loadBridgeState();
    if (savedState && bridgeState.route) {
      try {
        await executeBridge(bridgeState.route);
      } catch (error) {
        console.error("Error resuming bridge:", error);
      }
    }
  };

  // Render loading state
  if (isLoadingChains) {
    return (
      <div className="glass-card p-8 md:p-12 text-center">
        <div className="w-12 h-12 border-4 border-[#03b3c3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/70">Loading chains...</p>
      </div>
    );
  }

  // Render wallet connection prompt (mobile-optimized)
  if (!isConnected) {
    return (
      <div
        className="glass-card mobile-padding text-center mobile-spacing"
        {...swipeHandlers.handlers}
      >
        <h2 className="mobile-text-3xl font-heading font-black">
          Connect Your Wallet
        </h2>
        <p className="text-white/70 mobile-text-lg">
          Connect your wallet to start bridging to HyperEVM
        </p>
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#03b3c3]/20 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 md:w-10 md:h-10 text-[#03b3c3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        {isMobile ? (
          <MobileWalletConnect />
        ) : (
          <p className="text-white/50 text-sm">
            Use the wallet button in the navigation bar to connect
          </p>
        )}
      </div>
    );
  }

  // Render deposit modal
  if (showDepositModal && bridgeState.status === "success") {
    return (
      <DepositToHyperliquid
        amount={amount}
        token={selectedToToken?.symbol || selectedFromToken?.symbol || "USDC"}
        onSuccess={() => {
          console.log("✅ Deposit to Hyperliquid successful!");
          setShowDepositModal(false);
          setShowDashboard(true); // Go back to dashboard
        }}
        onCancel={() => {
          console.log("❌ Deposit to Hyperliquid cancelled");
          setShowDepositModal(false);
          setShowDashboard(true); // Go back to dashboard
        }}
      />
    );
  }

  // Render Hyperliquid success state
  if (
    destinationType === "hyperliquid" &&
    hyperliquidState.status === "success"
  ) {
    return (
      <div
        className="glass-card mobile-padding mobile-spacing text-center"
        {...swipeHandlers.handlers}
      >
        <div className="w-20 h-20 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-400"
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
        </div>

        <h2 className="mobile-text-3xl font-heading font-black mb-4">
          Deposit Complete!
        </h2>

        <p className="text-white/70 mb-6">
          Your funds have been deposited to your Hyperliquid trading account.
          You can now start trading!
        </p>

        {hyperliquidState.depositTxHash && (
          <div className="glass-card p-4 rounded-lg mb-6">
            <p className="text-sm text-white/50 mb-2">Deposit Transaction:</p>
            <a
              href={`https://arbiscan.io/tx/${hyperliquidState.depositTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#03b3c3] hover:underline font-mono text-sm break-all"
            >
              {hyperliquidState.depositTxHash}
            </a>
          </div>
        )}

        <div className="space-y-3">
          <a
            href="https://app.hyperliquid.xyz/trade"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 px-6 bg-[#03b3c3] text-white font-semibold rounded-lg hover:bg-[#03b3c3]/90 transition-colors"
          >
            Open Hyperliquid Trading
          </a>

          <button
            onClick={handleReset}
            className="w-full py-4 px-6 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
          >
            Bridge More Funds
          </button>
        </div>
      </div>
    );
  }

  // Render Hyperliquid error state
  if (
    destinationType === "hyperliquid" &&
    hyperliquidState.status === "error"
  ) {
    return (
      <ErrorRecovery
        error={
          hyperliquidState.error ||
          "An error occurred during the deposit process"
        }
        txHash={
          hyperliquidState.txHash || hyperliquidState.depositTxHash || undefined
        }
        lastAction="Hyperliquid Deposit"
        onRetry={() => {
          if (hyperliquidState.route) {
            executeHyperliquidDeposit(hyperliquidState.route);
          }
        }}
        onReset={handleReset}
      />
    );
  }

  // Render PostBridgeDashboard (NEW - replaces OnboardingGuide)
  if (showDashboard && bridgeState.status === "success") {
    return (
      <PostBridgeDashboard
        amount={amount}
        token={selectedToToken?.symbol || selectedFromToken?.symbol || "tokens"}
        onDepositClick={() => setShowDepositModal(true)}
        onReset={handleReset}
      />
    );
  }

  // Render success state with dashboard trigger
  if (bridgeState.status === "success") {
    // Auto-show dashboard after success
    if (!showDashboard) {
      setShowDashboard(true);
    }

    return (
      <PostBridgeDashboard
        amount={amount}
        token={selectedToToken?.symbol || selectedFromToken?.symbol || "tokens"}
        onDepositClick={() => setShowDepositModal(true)}
        onReset={handleReset}
      />
    );
  }

  // Render Hyperliquid deposit execution state
  if (
    destinationType === "hyperliquid" &&
    hyperliquidState.status !== "idle" &&
    hyperliquidState.status !== "route-ready" &&
    hyperliquidState.status !== "fetching-route" &&
    hyperliquidState.status !== "success" &&
    hyperliquidState.status !== "error"
  ) {
    const statusMessages: Record<string, string> = {
      "approving-source": "Approving Token",
      "bridging-to-arbitrum": "Bridging to Arbitrum",
      "waiting-for-arbitrum": "Waiting for Arbitrum",
      "depositing-to-hyperliquid": "Depositing to Hyperliquid",
    };

    return (
      <div
        className="glass-card mobile-padding mobile-spacing"
        {...swipeHandlers.handlers}
      >
        <h2 className="mobile-text-3xl font-heading font-black mb-4 md:mb-6">
          {statusMessages[hyperliquidState.status] || "Processing..."}
        </h2>

        {/* Flow indicator */}
        <div className="mb-6 p-4 glass-card rounded-lg border border-[#03b3c3]/30">
          <p className="text-sm text-white/70 mb-2">Deposit Flow:</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white">Your Chain</span>
            <span className="text-[#03b3c3]">→</span>
            <span
              className={
                hyperliquidState.status === "bridging-to-arbitrum" ||
                hyperliquidState.status === "approving-source"
                  ? "text-[#03b3c3] font-semibold"
                  : "text-white"
              }
            >
              Arbitrum
            </span>
            <span className="text-[#03b3c3]">→</span>
            <span
              className={
                hyperliquidState.status === "depositing-to-hyperliquid"
                  ? "text-[#03b3c3] font-semibold"
                  : "text-white"
              }
            >
              Hyperliquid
            </span>
          </div>
        </div>

        {hyperliquidState.steps.length > 0 ? (
          <BridgeProgress
            steps={hyperliquidState.steps.map((s) => ({
              stepIndex: s.stepIndex,
              type:
                s.type === "bridge-to-arbitrum"
                  ? "bridge"
                  : s.type === "wait-arbitrum"
                  ? "receive"
                  : s.type === "deposit-hyperliquid"
                  ? "post-bridge"
                  : s.type === "complete"
                  ? "receive"
                  : s.type, // Type is already validated as BridgeStep['type']
              title: s.title,
              description: s.description,
              status: s.status,
              txHash: s.txHash,
              chainId: s.chainId,
              explorerUrl: s.explorerUrl,
              canRetry: s.canRetry,
              error: s.error,
              estimatedTime: s.estimatedTime,
            }))}
            currentStepIndex={hyperliquidState.currentStepIndex}
            onRetryStep={retryHyperliquidStep}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 glass-card rounded-lg">
              <div className="w-8 h-8 border-4 border-[#03b3c3] border-t-transparent rounded-full animate-spin" />
              <div className="flex-1">
                <p className="text-white font-medium">Processing...</p>
                <p className="text-white/50 text-sm mt-1">
                  Please wait while we process your transaction
                </p>
              </div>
            </div>
          </div>
        )}

        {hyperliquidState.estimatedTime && (
          <p className="text-white/70 text-center mt-4">
            Estimated time remaining: ~
            {Math.ceil(hyperliquidState.estimatedTime / 60)} minutes
          </p>
        )}
      </div>
    );
  }

  // Render execution state with step-by-step progress (HyperEVM flow)
  if (
    destinationType === "hyperevm" &&
    (bridgeState.status === "executing" ||
      bridgeState.status === "bridging" ||
      bridgeState.status === "approving")
  ) {
    return (
      <div
        className="glass-card mobile-padding mobile-spacing"
        {...swipeHandlers.handlers}
      >
        <h2 className="mobile-text-3xl font-heading font-black mb-4 md:mb-6">
          {bridgeState.status === "approving"
            ? "Approving Token"
            : "Bridge in Progress"}
        </h2>

        {bridgeState.steps.length > 0 ? (
          <BridgeProgress
            steps={bridgeState.steps}
            currentStepIndex={bridgeState.currentStepIndex}
            onRetryStep={retryStep}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 glass-card rounded-lg">
              <div className="w-8 h-8 border-4 border-[#03b3c3] border-t-transparent rounded-full animate-spin" />
              <div className="flex-1">
                <p className="text-white font-medium">
                  {bridgeState.currentStep?.action?.fromToken?.symbol ||
                    selectedFromToken?.symbol}{" "}
                  →{bridgeState.currentStep?.action?.toToken?.symbol || "ETH"}
                </p>
                <p className="text-white/50 text-sm mt-1">
                  {bridgeState.status === "approving"
                    ? "Please approve the token in your wallet"
                    : "Processing transaction..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {bridgeState.estimatedTime && (
          <p className="text-white/70 text-center">
            Estimated time remaining: ~
            {Math.ceil(bridgeState.estimatedTime / 60)} minutes
          </p>
        )}
      </div>
    );
  }

  // Render Hyperliquid route preview
  if (
    destinationType === "hyperliquid" &&
    hyperliquidState.status === "route-ready" &&
    hyperliquidState.route
  ) {
    const route = hyperliquidState.route;
    const totalGasCost = route.gasCostUSD || "0";
    const minReceived = route.toAmountMin;
    const receivedToken = route.steps[route.steps.length - 1]?.action?.toToken;

    return (
      <div
        className="glass-card mobile-padding mobile-spacing"
        {...swipeHandlers.handlers}
      >
        <h2 className="mobile-text-3xl font-heading font-black mb-4 md:mb-6">
          Hyperliquid Deposit Preview
        </h2>

        {/* Flow visualization */}
        <div className="mb-6 p-4 glass-card rounded-lg border border-[#03b3c3]/30 bg-[#03b3c3]/5">
          <p className="text-sm text-white/70 mb-3">Deposit Flow:</p>
          <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
            <div className="flex flex-col items-center">
              <span className="text-white font-medium">
                {selectedFromToken?.symbol}
              </span>
              <span className="text-white/50 text-xs">
                {chains.find((c) => c.id === fromChainId)?.name}
              </span>
            </div>
            <span className="text-[#03b3c3] text-xl">→</span>
            <div className="flex flex-col items-center">
              <span className="text-white font-medium">USDC</span>
              <span className="text-white/50 text-xs">Arbitrum</span>
            </div>
            <span className="text-[#03b3c3] text-xl">→</span>
            <div className="flex flex-col items-center">
              <span className="text-white font-medium">USDC</span>
              <span className="text-white/50 text-xs">Hyperliquid</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Route Summary */}
          <div className="glass-card p-6 rounded-lg border border-[#03b3c3]/30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/70">Destination</span>
              <span className="text-[#03b3c3] font-semibold">
                Hyperliquid Exchange
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">You&apos;ll receive (min)</span>
                <span className="text-white font-semibold">
                  {formatTokenAmount(minReceived, receivedToken?.decimals || 6)}{" "}
                  USDC
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Estimated Time</span>
                <span className="text-white">
                  ~{Math.ceil((hyperliquidState.estimatedTime || 0) / 60)} min
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Gas Cost (Bridge)</span>
                <span className="text-white">
                  ${parseFloat(totalGasCost).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Gas Cost (Deposit)</span>
                <span className="text-white">~$0.50</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Steps</span>
                <span className="text-white">
                  {hyperliquidState.steps.length} steps
                </span>
              </div>
            </div>

            {/* Gas Reserve Note */}
            {hyperliquidState.needsGasBridge && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">
                      Gas Reserve Included
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      We&apos;ll bridge ~${hyperliquidState.gasAmountUsd} ETH to
                      Arbitrum for gas fees. This ensures your Hyperliquid
                      deposit completes successfully.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Steps Preview */}
          <div className="space-y-2">
            <p className="text-white/50 text-sm">Deposit Steps:</p>
            {hyperliquidState.steps.slice(0, 5).map((step, index) => (
              <div key={index} className="glass-card p-3 rounded-lg text-sm">
                <span className="text-[#03b3c3]">Step {index + 1}:</span>
                <span className="text-white ml-2">{step.title}</span>
              </div>
            ))}
            {hyperliquidState.steps.length > 5 && (
              <p className="text-white/50 text-xs text-center">
                +{hyperliquidState.steps.length - 5} more steps
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleExecute}
          className="w-full text-base md:text-lg py-5 md:py-4 min-h-[56px] md:min-h-[44px] touch-manipulation"
        >
          Confirm & Deposit to Hyperliquid
        </Button>
      </div>
    );
  }

  // Render HyperEVM route preview
  if (
    destinationType === "hyperevm" &&
    bridgeState.status === "route-ready" &&
    bridgeState.route
  ) {
    const route = bridgeState.route;

    // Debug: Log the full route to see gas cost structure
    console.log("Full route data:", route);
    console.log("Gas cost USD:", route.gasCostUSD);
    console.log(
      "Steps gas costs:",
      route.steps.map((s) => ({
        tool: s.toolDetails.name,
        gasCostUSD: s.estimate.gasCosts?.[0]?.amountUSD,
        type: s.type,
      }))
    );

    const totalGasCost = route.gasCostUSD || "0";
    const minReceived = route.toAmountMin;
    const receivedToken = route.steps[route.steps.length - 1]?.action?.toToken;

    return (
      <div
        className="glass-card mobile-padding mobile-spacing"
        {...swipeHandlers.handlers}
      >
        <h2 className="mobile-text-3xl font-heading font-black mb-4 md:mb-6">
          Route Preview
        </h2>

        <div className="space-y-4">
          {/* Route Summary */}
          <div className="glass-card p-6 rounded-lg border border-[#03b3c3]/30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/70">Best Route</span>
              <span className="text-[#03b3c3] font-semibold">
                Auto-selected
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">You&apos;ll receive (min)</span>
                <span className="text-white font-semibold">
                  {formatTokenAmount(
                    minReceived,
                    receivedToken?.decimals || 18
                  )}{" "}
                  {receivedToken?.symbol || "ETH"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Estimated Time</span>
                <span className="text-white">
                  ~{Math.ceil((bridgeState.estimatedTime || 0) / 60)} min
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Gas Cost</span>
                <span className="text-white">
                  ${parseFloat(totalGasCost).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Steps</span>
                <span className="text-white">
                  {route.steps.length} step{route.steps.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Route Steps */}
          <div className="space-y-2">
            <p className="text-white/50 text-sm">Route Steps:</p>
            {route.steps.map((step, index) => (
              <div key={index} className="glass-card p-3 rounded-lg text-sm">
                <span className="text-[#03b3c3]">Step {index + 1}:</span>
                <span className="text-white ml-2">
                  {step.toolDetails.name} - {step.action.fromToken.symbol} →{" "}
                  {step.action.toToken.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleExecute}
          className="w-full text-base md:text-lg py-5 md:py-4 min-h-[56px] md:min-h-[44px] touch-manipulation"
        >
          Confirm & Bridge
        </Button>
      </div>
    );
  }

  // Render error state with recovery options
  if (bridgeState.status === "error") {
    return (
      <ErrorRecovery
        error={
          bridgeState.error || "An error occurred during the bridge process"
        }
        txHash={bridgeState.txHash || undefined}
        lastAction={
          bridgeState.currentStep
            ? `${bridgeState.currentStep.action.fromToken.symbol} → ${bridgeState.currentStep.action.toToken.symbol}`
            : undefined
        }
        onRetry={handleRetry}
        onReset={handleReset}
        onResume={bridgeState.route ? handleResume : undefined}
      />
    );
  }

  // Render main input form (mobile-optimized)
  return (
    <div
      className="glass-card mobile-padding mobile-spacing"
      {...swipeHandlers.handlers}
    >
      <h2 className="mobile-text-3xl font-heading font-black mb-4 md:mb-6">
        {destinationType === "hyperliquid"
          ? "Deposit to Hyperliquid"
          : "Bridge to HyperEVM"}
      </h2>

      <div className="space-y-4 md:space-y-5">
        {/* Destination Type Selector */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Destination
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDestinationType("hyperliquid")}
              className={`p-4 rounded-lg border transition-all ${
                destinationType === "hyperliquid"
                  ? "border-[#03b3c3] bg-[#03b3c3]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {/* <div className="text-2xl mb-2">📈</div> */}
              <div className="text-white font-medium text-sm">
                Hyperliquid Exchange
              </div>
              <div className="text-white/50 text-xs mt-1">
                Direct deposit to trading
              </div>
            </button>
            <button
              type="button"
              onClick={() => setDestinationType("hyperevm")}
              className={`p-4 rounded-lg border transition-all ${
                destinationType === "hyperevm"
                  ? "border-[#03b3c3] bg-[#03b3c3]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {/* <div className="text-2xl mb-2">🔷</div> */}
              <div className="text-white font-medium text-sm">HyperEVM</div>
              <div className="text-white/50 text-xs mt-1">
                DeFi & smart contracts
              </div>
            </button>
          </div>
        </div>

        {/* Flow explanation for Hyperliquid */}
        {destinationType === "hyperliquid" && (
          <div className="p-4 glass-card rounded-lg border border-[#03b3c3]/20 bg-[#03b3c3]/5">
            <p className="text-sm text-white/70 mb-2">Deposit Flow:</p>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-white">Your Token</span>
              <span className="text-[#03b3c3]">→</span>
              <span className="text-white">Arbitrum USDC</span>
              <span className="text-[#03b3c3]">→</span>
              <span className="text-[#03b3c3] font-semibold">Hyperliquid</span>
            </div>
            <p className="text-xs text-white/50 mt-2">
              Funds will be bridged to Arbitrum then deposited to your
              Hyperliquid trading account
            </p>
          </div>
        )}

        {/* From Chain Selection */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            From Chain
          </label>
          <select
            value={fromChainId}
            onChange={(e) => setFromChainId(Number(e.target.value))}
            className="glass-input w-full px-4 py-4 md:py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white focus:border-[#03b3c3] focus:outline-none transition-colors touch-manipulation text-base"
          >
            {chains
              .filter((chain) => chain.id !== CHAIN_IDS.HYPEREVM)
              .map((chain) => (
                <option key={chain.id} value={chain.id} className="bg-black">
                  {chain.name}
                </option>
              ))}
          </select>
        </div>

        {/* From Token Selection */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            From Token
          </label>
          {isLoadingTokens ? (
            <div className="glass-input w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white/50">
              Loading tokens...
            </div>
          ) : fromTokens.length === 0 ? (
            <div className="glass-input w-full px-4 py-3 rounded-lg border border-red-400/30 bg-red-400/5 text-red-400">
              No tokens available for this chain
            </div>
          ) : (
            <select
              value={selectedFromToken?.address || ""}
              onChange={(e) => {
                console.log("Token selection changed:", e.target.value);
                const token = fromTokens.find(
                  (t) => t.address === e.target.value
                );
                console.log("Found token:", token);
                setSelectedFromToken(token || null);
              }}
              disabled={isLoadingTokens || fromTokens.length === 0}
              className="glass-input w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white focus:border-[#03b3c3] focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
            >
              {fromTokens.map((token) => (
                <option
                  key={token.address}
                  value={token.address}
                  className="bg-black text-white"
                >
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          )}
          {fromTokens.length > 0 && (
            <p className="text-xs text-white/50 mt-1">
              {fromTokens.length} token{fromTokens.length > 1 ? "s" : ""}{" "}
              available
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
              inputMode="decimal"
              className="glass-input flex-1 px-4 py-4 md:py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white focus:border-[#03b3c3] focus:outline-none transition-colors touch-manipulation text-base"
            />
            <button
              onClick={handleMaxClick}
              className="px-5 md:px-4 py-4 md:py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation min-h-[48px] md:min-h-[44px] font-medium"
            >
              Max
            </button>
          </div>
          <p className="text-sm text-white/50 mt-2">
            Balance:{" "}
            {isBalanceLoading
              ? "Loading..."
              : `${parseFloat(balance).toFixed(6)} ${
                  symbol || selectedFromToken?.symbol || ""
                }`}
          </p>
        </div>

        {/* To Chain - Dynamic based on destination type */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            To Chain
          </label>
          <div className="glass-input px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white">
            {destinationType === "hyperliquid" ? (
              <span className="flex items-center gap-2">
                <span>Arbitrum</span>
                <span className="text-[#03b3c3]">→</span>
                <span className="text-[#03b3c3] font-semibold">
                  Hyperliquid
                </span>
              </span>
            ) : (
              "HyperEVM"
            )}
          </div>
        </div>

        {/* Destination Token Selection (only for HyperEVM) */}
        {destinationType === "hyperevm" && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Destination Token (HyperEVM)
            </label>
            {isLoadingToTokens ? (
              <div className="glass-input w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white/50">
                Loading tokens...
              </div>
            ) : toTokens.length === 0 ? (
              <div className="glass-input w-full px-4 py-3 rounded-lg border border-red-400/30 bg-red-400/5 text-red-400">
                No tokens available on HyperEVM
              </div>
            ) : (
              <select
                value={selectedToToken?.address || ""}
                onChange={(e) => {
                  const token = toTokens.find(
                    (t) => t.address === e.target.value
                  );
                  setSelectedToToken(token || null);
                }}
                disabled={isLoadingToTokens || toTokens.length === 0}
                className="glass-input w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white focus:border-[#03b3c3] focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
              >
                {toTokens.map((token) => (
                  <option
                    key={token.address}
                    value={token.address}
                    className="bg-black text-white"
                  >
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            )}
            {toTokens.length > 0 && (
              <p className="text-xs text-white/50 mt-1">
                {toTokens.length} token{toTokens.length > 1 ? "s" : ""}{" "}
                available on HyperEVM
              </p>
            )}
          </div>
        )}

        {/* For Hyperliquid - show destination info */}
        {destinationType === "hyperliquid" && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Destination Token
            </label>
            <div className="glass-input px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white flex items-center gap-2">
              {/* <span className="text-lg">💵</span> */}
              <span>USDC</span>
              <span className="text-white/50 text-sm ml-auto">
                on Hyperliquid
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Your tokens will be converted to USDC and deposited to Hyperliquid
            </p>
          </div>
        )}

        {/* Auto-deposit Option (only for HyperEVM) */}
        {destinationType === "hyperevm" && (
          <label className="flex items-center gap-3 glass-card p-4 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
            <input
              type="checkbox"
              checked={autoDeposit}
              onChange={(e) => setAutoDeposit(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#03b3c3] focus:ring-[#03b3c3] focus:ring-offset-0"
            />
            <div>
              <span className="text-white block">
                Auto-deposit to Hyperliquid
              </span>
              <span className="text-white/50 text-sm">
                Automatically deposit funds to your Hyperliquid trading account
              </span>
            </div>
          </label>
        )}
      </div>

      <Button
        onClick={handleGetQuote}
        className="w-full"
        disabled={
          !selectedFromToken ||
          !amount ||
          parseFloat(amount) <= 0 ||
          bridgeState.status === "fetching-route" ||
          hyperliquidState.status === "fetching-route"
        }
      >
        {bridgeState.status === "fetching-route" ||
        hyperliquidState.status === "fetching-route" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Finding Best Route...
          </span>
        ) : destinationType === "hyperliquid" ? (
          "Get Deposit Quote"
        ) : (
          "Get Quote"
        )}
      </Button>
    </div>
  );
}

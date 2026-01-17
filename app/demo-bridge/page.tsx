"use client";

import { useState, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import BridgeProgress from "@/components/BridgeProgress";
import ErrorRecovery from "@/components/ErrorRecovery";
import MobileWalletConnect from "@/components/MobileWalletConnect";
import { useLiFiBridge } from "@/lib/hooks/useLiFiBridge";
import { useTokenBalance } from "@/lib/hooks/useTokenBalance";
import {
  getSupportedChains,
  getTokensForChain,
  parseTokenAmount,
  formatTokenAmount,
} from "@/lib/utils/lifi-helpers";
import { CHAIN_IDS } from "@/lib/config/lifi";
import type { Token } from "@lifi/sdk";

// Demo bridge routes configuration
const DEMO_ROUTES = [
  {
    id: "arbitrum-usdc-to-base-eth",
    name: "Arbitrum USDC → Base ETH",
    description: "Bridge USDC from Arbitrum to Base as ETH",
    fromChainId: CHAIN_IDS.ARBITRUM,
    toChainId: CHAIN_IDS.BASE,
    fromTokenSymbol: "USDC",
    toTokenSymbol: "ETH",
  },
  {
    id: "hyperevm-to-base",
    name: "HyperEVM → Base",
    description: "Bridge from HyperEVM to Base",
    fromChainId: CHAIN_IDS.HYPEREVM,
    toChainId: CHAIN_IDS.BASE,
    fromTokenSymbol: "ETH",
    toTokenSymbol: "ETH",
  },
  {
    id: "base-eth-to-arbitrum",
    name: "Base ETH → Arbitrum",
    description: "Bridge ETH from Base to Arbitrum (small amounts)",
    fromChainId: CHAIN_IDS.BASE,
    toChainId: CHAIN_IDS.ARBITRUM,
    fromTokenSymbol: "ETH",
    toTokenSymbol: "ETH",
  },
] as const;

// Helper function to get chain name from chain ID
function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    [CHAIN_IDS.ETHEREUM]: "Ethereum",
    [CHAIN_IDS.ARBITRUM]: "Arbitrum",
    [CHAIN_IDS.BASE]: "Base",
    [CHAIN_IDS.OPTIMISM]: "Optimism",
    [CHAIN_IDS.POLYGON]: "Polygon",
    [CHAIN_IDS.BSC]: "BSC",
    [CHAIN_IDS.HYPEREVM]: "HyperEVM",
  };
  return chainNames[chainId] || `Chain ${chainId}`;
}

export default function DemoBridgePage() {
  const { address, isConnected, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { bridgeState, fetchRoute, executeBridge, reset, retryStep } =
    useLiFiBridge();

  const [selectedRoute, setSelectedRoute] = useState<
    (typeof DEMO_ROUTES)[number] | null
  >(null);
  const [fromTokens, setFromTokens] = useState<Token[]>([]);
  const [toTokens, setToTokens] = useState<Token[]>([]);
  const [selectedFromToken, setSelectedFromToken] = useState<Token | null>(
    null
  );
  const [selectedToToken, setSelectedToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isLoadingChains, setIsLoadingChains] = useState(true);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  // Get balance for selected token
  const {
    balance,
    isLoading: isBalanceLoading,
    symbol,
  } = useTokenBalance(
    selectedRoute?.fromChainId || 0,
    selectedFromToken?.address
  );

  // Load chains on mount (for future use)
  useEffect(() => {
    const loadChains = async () => {
      setIsLoadingChains(true);
      await getSupportedChains();
      setIsLoadingChains(false);
    };
    loadChains();
  }, []);

  // Load tokens when route changes
  useEffect(() => {
    const loadTokens = async () => {
      if (!selectedRoute) {
        setFromTokens([]);
        setToTokens([]);
        setSelectedFromToken(null);
        setSelectedToToken(null);
        return;
      }

      setIsLoadingTokens(true);

      try {
        // Load from tokens
        const fromTokensList = await getTokensForChain(
          selectedRoute.fromChainId
        );

        // Try to find exact match first, then partial match
        let fromToken = fromTokensList.find(
          (t) =>
            t.symbol.toUpperCase() ===
            selectedRoute.fromTokenSymbol.toUpperCase()
        );

        // If not found, try partial match (e.g., "WETH" for "ETH")
        if (!fromToken) {
          fromToken = fromTokensList.find(
            (t) =>
              t.symbol
                .toUpperCase()
                .includes(selectedRoute.fromTokenSymbol.toUpperCase()) ||
              selectedRoute.fromTokenSymbol
                .toUpperCase()
                .includes(t.symbol.toUpperCase())
          );
        }

        // For native tokens (ETH), look for zero address
        if (
          !fromToken &&
          selectedRoute.fromTokenSymbol.toUpperCase() === "ETH"
        ) {
          fromToken = fromTokensList.find(
            (t) => t.address === "0x0000000000000000000000000000000000000000"
          );
        }

        setFromTokens(fromTokensList);
        setSelectedFromToken(fromToken || fromTokensList[0] || null);

        // Load to tokens
        const toTokensList = await getTokensForChain(selectedRoute.toChainId);

        // Try to find exact match first, then partial match
        let toToken = toTokensList.find(
          (t) =>
            t.symbol.toUpperCase() === selectedRoute.toTokenSymbol.toUpperCase()
        );

        // If not found, try partial match
        if (!toToken) {
          toToken = toTokensList.find(
            (t) =>
              t.symbol
                .toUpperCase()
                .includes(selectedRoute.toTokenSymbol.toUpperCase()) ||
              selectedRoute.toTokenSymbol
                .toUpperCase()
                .includes(t.symbol.toUpperCase())
          );
        }

        // For native tokens (ETH), look for zero address
        if (!toToken && selectedRoute.toTokenSymbol.toUpperCase() === "ETH") {
          toToken = toTokensList.find(
            (t) => t.address === "0x0000000000000000000000000000000000000000"
          );
        }

        setToTokens(toTokensList);
        setSelectedToToken(toToken || toTokensList[0] || null);
      } catch (error) {
        console.error("Error loading tokens:", error);
        setFromTokens([]);
        setToTokens([]);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, [selectedRoute]);

  const handleMaxClick = () => {
    if (balance) {
      setAmount(balance);
    }
  };

  const handleGetQuote = async () => {
    if (
      !address ||
      !selectedFromToken ||
      !selectedToToken ||
      !amount ||
      !selectedRoute
    ) {
      return;
    }

    // Check if user is on the correct chain
    if (chain?.id !== selectedRoute.fromChainId) {
      alert(
        `Please switch to ${getChainName(
          selectedRoute.fromChainId
        )} first. You are currently on ${getChainName(chain?.id || 0)}.`
      );
      return;
    }

    try {
      const amountInWei = parseTokenAmount(amount, selectedFromToken.decimals);

      await fetchRoute({
        fromChainId: selectedRoute.fromChainId,
        toChainId: selectedRoute.toChainId,
        fromTokenAddress: selectedFromToken.address,
        toTokenAddress: selectedToToken.address,
        fromAmount: amountInWei,
        fromAddress: address,
      });
    } catch (error) {
      console.error("Error fetching quote:", error);
    }
  };

  const handleSwitchChain = async () => {
    if (!selectedRoute || !switchChainAsync) return;

    try {
      setIsSwitchingChain(true);
      await switchChainAsync({ chainId: selectedRoute.fromChainId });
    } catch (error) {
      console.error("Error switching chain:", error);
      alert("Failed to switch chain. Please switch manually in your wallet.");
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const handleExecute = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first before executing the bridge.");
      return;
    }

    if (!bridgeState.route || !selectedRoute) return;

    // Check if user is on the correct chain before executing
    if (chain?.id !== selectedRoute.fromChainId) {
      alert(
        `Please switch to ${getChainName(
          selectedRoute.fromChainId
        )} first. You are currently on ${getChainName(chain?.id || 0)}.`
      );
      return;
    }

    try {
      await executeBridge(bridgeState.route);
    } catch (error) {
      console.error("Error executing bridge:", error);
    }
  };

  const handleReset = () => {
    reset();
    setAmount("");
    setSelectedRoute(null);
  };

  // Render loading state
  if (isLoadingChains) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 md:pt-40 pb-8 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-12 text-center">
            <div className="w-12 h-12 border-4 border-[#03b3c3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/70">Loading chains...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render wallet connection prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 md:pt-40 pb-8 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-12 text-center">
            <h2 className="text-3xl font-heading font-black mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-white/70 mb-6">
              Connect your wallet to start demo bridging
            </p>
            <MobileWalletConnect />
          </div>
        </div>
      </div>
    );
  }

  // Render execution state
  if (
    bridgeState.status === "executing" ||
    bridgeState.status === "bridging" ||
    bridgeState.status === "approving"
  ) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 md:pt-40 pb-8 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-3xl font-heading font-black mb-6">
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
                    <p className="text-white font-medium">Processing...</p>
                    <p className="text-white/50 text-sm mt-1">
                      Please wait while we process your transaction
                    </p>
                  </div>
                </div>
              </div>
            )}

            {bridgeState.estimatedTime && (
              <p className="text-white/70 text-center mt-4">
                Estimated time remaining: ~
                {Math.ceil(bridgeState.estimatedTime / 60)} minutes
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render success state
  if (bridgeState.status === "success") {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 md:pt-40 pb-8 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-12 text-center">
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

            <h2 className="text-3xl font-heading font-black mb-4">
              Bridge Complete!
            </h2>

            <p className="text-white/70 mb-6">
              Your funds have been successfully bridged.
            </p>

            {bridgeState.txHash && selectedRoute && (
              <div className="glass-card p-4 rounded-lg mb-6">
                <p className="text-sm text-white/50 mb-2">Transaction Hash:</p>
                <a
                  href={(() => {
                    const explorerUrls: Record<number, string> = {
                      [CHAIN_IDS.BASE]: "https://basescan.org",
                      [CHAIN_IDS.ARBITRUM]: "https://arbiscan.io",
                      [CHAIN_IDS.ETHEREUM]: "https://etherscan.io",
                      [CHAIN_IDS.OPTIMISM]: "https://optimistic.etherscan.io",
                      [CHAIN_IDS.POLYGON]: "https://polygonscan.com",
                    };
                    const baseUrl =
                      explorerUrls[selectedRoute.toChainId] ||
                      "https://basescan.org";
                    return `${baseUrl}/tx/${bridgeState.txHash}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#03b3c3] hover:underline font-mono text-sm break-all"
                >
                  {bridgeState.txHash}
                </a>
              </div>
            )}

            <Button onClick={handleReset} className="w-full">
              Bridge More
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (bridgeState.status === "error") {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 md:pt-40 pb-8 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
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
            onRetry={() => {
              if (bridgeState.route) {
                executeBridge(bridgeState.route);
              }
            }}
            onReset={handleReset}
          />
        </div>
      </div>
    );
  }

  // Render route preview
  if (bridgeState.status === "route-ready" && bridgeState.route) {
    const route = bridgeState.route;
    const totalGasCost = route.gasCostUSD || "0";
    const minReceived = route.toAmountMin;
    const receivedToken = route.steps[route.steps.length - 1]?.action?.toToken;

    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 md:pt-40 pb-8 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-3xl font-heading font-black mb-6">
              Route Preview
            </h2>

            <div className="space-y-4">
              {/* Route Summary */}
              <div className="glass-card p-6 rounded-lg border border-[#03b3c3]/30">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/70">Route</span>
                  <span className="text-[#03b3c3] font-semibold">
                    {selectedRoute?.name}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">
                      You&apos;ll receive (min)
                    </span>
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
                      {route.steps.length} step
                      {route.steps.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Route Steps */}
              <div className="space-y-2">
                <p className="text-white/50 text-sm">Route Steps:</p>
                {route.steps.map((step, index) => (
                  <div
                    key={index}
                    className="glass-card p-3 rounded-lg text-sm"
                  >
                    <span className="text-[#03b3c3]">Step {index + 1}:</span>
                    <span className="text-white ml-2">
                      {step.toolDetails.name} - {step.action.fromToken.symbol} →{" "}
                      {step.action.toToken.symbol}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleReset}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20"
              >
                Cancel
              </Button>
              <Button onClick={handleExecute} className="flex-1">
                Confirm & Bridge
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main form
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-24 md:pt-40 pb-8 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="glass-card p-6 md:p-8">
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm font-medium mb-1">
              ⚠️ Development Demo Page
            </p>
            <p className="text-white/70 text-sm">
              This page is for development and testing purposes only. Use it to
              test reverse bridge flows.
            </p>
          </div>

          <h2 className="text-3xl font-heading font-black mb-6">
            Demo Bridge (Development)
          </h2>
          <p className="text-white/70 mb-6">
            Select a demo bridge route for testing purposes
          </p>

          <div className="space-y-6">
            {/* Route Selection */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                Select Bridge Route
              </label>
              <div className="grid gap-3">
                {DEMO_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoute(route);
                      setAmount("");
                      reset();
                    }}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      selectedRoute?.id === route.id
                        ? "border-[#03b3c3] bg-[#03b3c3]/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-white font-medium">{route.name}</div>
                    <div className="text-white/50 text-sm mt-1">
                      {route.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chain Warning (only show if route is selected and user is on wrong chain) */}
            {selectedRoute &&
              chain &&
              chain.id !== selectedRoute.fromChainId && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-yellow-400 text-sm font-medium mb-1">
                        Wrong Network
                      </p>
                      <p className="text-white/70 text-sm mb-3">
                        You are currently on{" "}
                        <span className="font-semibold text-white">
                          {getChainName(chain.id)}
                        </span>
                        . You need to switch to{" "}
                        <span className="font-semibold text-white">
                          {getChainName(selectedRoute.fromChainId)}
                        </span>{" "}
                        to bridge from this route.
                      </p>
                      <Button
                        onClick={handleSwitchChain}
                        disabled={isSwitchingChain}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/50 text-yellow-400"
                      >
                        {isSwitchingChain ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            Switching...
                          </span>
                        ) : (
                          "Switch Network"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            {/* Token Selection (only show if route is selected) */}
            {selectedRoute && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    From Token ({selectedRoute.fromTokenSymbol})
                  </label>
                  {isLoadingTokens ? (
                    <div className="glass-input w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white/50">
                      Loading tokens...
                    </div>
                  ) : fromTokens.length === 0 ? (
                    <div className="glass-input w-full px-4 py-3 rounded-lg border border-red-400/30 bg-red-400/5 text-red-400">
                      No tokens available
                    </div>
                  ) : (
                    <select
                      value={selectedFromToken?.address || ""}
                      onChange={(e) => {
                        const token = fromTokens.find(
                          (t) => t.address === e.target.value
                        );
                        setSelectedFromToken(token || null);
                      }}
                      className="glass-input w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white focus:border-[#03b3c3] focus:outline-none transition-colors"
                    >
                      {fromTokens.map((token) => (
                        <option
                          key={token.address}
                          value={token.address}
                          className="bg-black"
                        >
                          {token.symbol} - {token.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    To Token ({selectedRoute.toTokenSymbol})
                  </label>
                  {isLoadingTokens ? (
                    <div className="glass-input w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white/50">
                      Loading tokens...
                    </div>
                  ) : toTokens.length === 0 ? (
                    <div className="glass-input w-full px-4 py-3 rounded-lg border border-red-400/30 bg-red-400/5 text-red-400">
                      No tokens available
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
                      className="glass-input w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white focus:border-[#03b3c3] focus:outline-none transition-colors"
                    >
                      {toTokens.map((token) => (
                        <option
                          key={token.address}
                          value={token.address}
                          className="bg-black"
                        >
                          {token.symbol} - {token.name}
                        </option>
                      ))}
                    </select>
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
                      className="glass-input flex-1 px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white focus:border-[#03b3c3] focus:outline-none transition-colors"
                    />
                    <button
                      onClick={handleMaxClick}
                      className="px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-colors font-medium"
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

                <Button
                  onClick={handleGetQuote}
                  className="w-full"
                  disabled={
                    !selectedFromToken ||
                    !selectedToToken ||
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    bridgeState.status === "fetching-route" ||
                    (chain && chain.id !== selectedRoute.fromChainId)
                  }
                >
                  {bridgeState.status === "fetching-route" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Finding Best Route...
                    </span>
                  ) : (
                    "Get Quote"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

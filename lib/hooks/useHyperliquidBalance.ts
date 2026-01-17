import { useState, useEffect, useCallback } from "react";

// Hyperliquid API endpoints
const HYPERLIQUID_API_URL = "https://api.hyperliquid.xyz/info";

export interface HyperliquidBalance {
  // Perp account
  accountValue: string;
  totalMarginUsed: string;
  withdrawable: string;
  // Spot balances
  spotBalances: {
    coin: string;
    total: string;
    hold: string;
  }[];
  // Combined USDC
  totalUsdcBalance: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface ClearinghouseStateResponse {
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  withdrawable: string;
  crossMarginSummary?: {
    accountValue: string;
  };
  assetPositions?: unknown[];
}

interface SpotClearinghouseStateResponse {
  balances: {
    coin: string;
    token: number;
    hold: string;
    total: string;
    entryNtl: string;
  }[];
}

export function useHyperliquidBalance(address: string | undefined) {
  const [balance, setBalance] = useState<HyperliquidBalance>({
    accountValue: "0",
    totalMarginUsed: "0",
    withdrawable: "0",
    spotBalances: [],
    totalUsdcBalance: 0,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!address) {
      return;
    }

    setBalance((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch both perp and spot clearinghouse state in parallel
      const [perpResponse, spotResponse] = await Promise.all([
        fetch(HYPERLIQUID_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "clearinghouseState",
            user: address,
          }),
        }),
        fetch(HYPERLIQUID_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "spotClearinghouseState",
            user: address,
          }),
        }),
      ]);

      if (!perpResponse.ok || !spotResponse.ok) {
        throw new Error("Failed to fetch Hyperliquid balance");
      }

      const perpData: ClearinghouseStateResponse = await perpResponse.json();
      const spotData: SpotClearinghouseStateResponse = await spotResponse.json();

      // Parse perp account value
      const perpAccountValue = parseFloat(perpData.marginSummary?.accountValue || "0");
      const perpWithdrawable = parseFloat(perpData.withdrawable || "0");

      // Parse spot balances
      const spotBalances = (spotData.balances || []).map((b) => ({
        coin: b.coin,
        total: b.total,
        hold: b.hold,
      }));

      // Find USDC in spot balances
      const usdcSpotBalance = spotBalances.find((b) => b.coin === "USDC");
      const spotUsdcTotal = parseFloat(usdcSpotBalance?.total || "0");

      // Total USDC = perp account value + spot USDC
      const totalUsdcBalance = perpAccountValue + spotUsdcTotal;

      console.log("📊 Hyperliquid balance fetched:", {
        perpAccountValue,
        spotUsdcTotal,
        totalUsdcBalance,
        perpWithdrawable,
      });

      setBalance({
        accountValue: perpData.marginSummary?.accountValue || "0",
        totalMarginUsed: perpData.marginSummary?.totalMarginUsed || "0",
        withdrawable: perpData.withdrawable || "0",
        spotBalances,
        totalUsdcBalance,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error("Error fetching Hyperliquid balance:", error);
      setBalance((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch balance",
      }));
    }
  }, [address]);

  // Auto-fetch on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address, fetchBalance]);

  // Refetch function with optional delay (useful after deposit)
  const refetchWithDelay = useCallback(
    async (delayMs: number = 2000) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await fetchBalance();
    },
    [fetchBalance]
  );

  return {
    ...balance,
    refetch: fetchBalance,
    refetchWithDelay,
  };
}

/**
 * Pear Protocol API Integration
 * 
 * Pear Protocol offers pair trading on Hyperliquid Exchange
 * 
 * Official Docs: https://docs.pearprotocol.io/api-integration/overview
 * 
 * API Endpoint:
 * - Mainnet: hl-v2.pearprotocol.io
 * 
 * Features:
 * - Pair trading (long one asset, short another)
 * - Statistical arbitrage opportunities
 * - Narrative-based and fundamental trading
 */

// API Configuration
export const PEAR_API_BASE_URL = "https://hl-v2.pearprotocol.io";

/**
 * Popular trading pairs on Pear Protocol
 */
export const POPULAR_PAIRS = [
  {
    id: "eth-btc",
    name: "ETH/BTC",
    asset1: "ETH",
    asset2: "BTC",
    description: "Classic pair trade between top two crypto assets",
    category: "Major",
  },
  {
    id: "sol-avax",
    name: "SOL/AVAX",
    asset1: "SOL",
    asset2: "AVAX",
    description: "Layer 1 blockchain platforms",
    category: "L1s",
  },
  {
    id: "arb-op",
    name: "ARB/OP",
    asset1: "ARB",
    asset2: "OP",
    description: "Ethereum Layer 2 rollups",
    category: "L2s",
  },
  {
    id: "link-uni",
    name: "LINK/UNI",
    asset1: "LINK",
    asset2: "UNI",
    description: "DeFi infrastructure tokens",
    category: "DeFi",
  },
] as const;

export interface PairTradeParams {
  pair: string;
  asset1: string;
  asset2: string;
  amount: number; // Amount in USD
  direction: "long-short" | "short-long"; // Long asset1 / Short asset2, or vice versa
  leverage?: number; // Default 1x
}

export interface PairTradeResponse {
  success: boolean;
  tradeId?: string;
  message?: string;
  estimatedPnL?: number;
  asset1Position?: {
    asset: string;
    side: "long" | "short";
    size: number;
    entryPrice: number;
  };
  asset2Position?: {
    asset: string;
    side: "long" | "short";
    size: number;
    entryPrice: number;
  };
}

/**
 * Get current market prices for a pair (Mock)
 * 
 * In production, this would call Pear Protocol's market data endpoint
 */
export async function getPairMarketData(
  asset1: string,
  asset2: string
): Promise<{
  asset1Price: number;
  asset2Price: number;
  spread: number;
  correlation: number;
}> {
  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock data - in production, fetch from Pear API
  const mockPrices: Record<string, number> = {
    ETH: 3200,
    BTC: 95000,
    SOL: 180,
    AVAX: 35,
    ARB: 0.85,
    OP: 2.1,
    LINK: 15,
    UNI: 8,
  };

  const price1 = mockPrices[asset1] || 100;
  const price2 = mockPrices[asset2] || 100;
  const spread = Math.abs(price1 - price2) / ((price1 + price2) / 2);

  return {
    asset1Price: price1,
    asset2Price: price2,
    spread: spread * 100, // As percentage
    correlation: 0.75 + Math.random() * 0.2, // Mock correlation 0.75-0.95
  };
}

/**
 * Execute a pair trade on Pear Protocol (Mock)
 * 
 * This opens a pair trade position on Hyperliquid via Pear Protocol
 * 
 * Flow:
 * 1. User specifies pair and direction (e.g., Long ETH / Short BTC)
 * 2. Pear Protocol calculates optimal sizing and executes both legs
 * 3. Positions are managed as a single pair trade unit
 * 4. Close the pair trade in one transaction
 */
export async function executePairTrade(
  params: PairTradeParams
): Promise<PairTradeResponse> {
  try {
    console.log("📊 Executing pair trade on Pear Protocol:", params);

    // Mock API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get market data
    const marketData = await getPairMarketData(params.asset1, params.asset2);

    // Calculate position sizes (simplified)
    const leverage = params.leverage || 1;
    const totalAmount = params.amount * leverage;
    
    // Split amount between two assets based on their prices
    const asset1Size = totalAmount / 2 / marketData.asset1Price;
    const asset2Size = totalAmount / 2 / marketData.asset2Price;

    // Determine sides based on direction
    const [asset1Side, asset2Side] =
      params.direction === "long-short"
        ? (["long", "short"] as const)
        : (["short", "long"] as const);

    // Mock successful response
    const mockResponse: PairTradeResponse = {
      success: true,
      tradeId: `pair_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      message: `Successfully opened ${params.asset1}/${params.asset2} pair trade`,
      estimatedPnL: 0, // Initial P&L is 0
      asset1Position: {
        asset: params.asset1,
        side: asset1Side,
        size: asset1Size,
        entryPrice: marketData.asset1Price,
      },
      asset2Position: {
        asset: params.asset2,
        side: asset2Side,
        size: asset2Size,
        entryPrice: marketData.asset2Price,
      },
    };

    console.log("✅ Pair trade executed:", mockResponse);
    return mockResponse;
  } catch (error) {
    console.error("❌ Error executing pair trade:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to execute pair trade",
    };
  }
}

/**
 * Get a beginner-friendly pair trade suggestion
 * 
 * This selects a popular, low-risk pair trade for first-time users
 */
export function getBeginnerPairSuggestion(amount: number): {
  pair: typeof POPULAR_PAIRS[number];
  params: PairTradeParams;
  rationale: string;
} {
  // For beginners, suggest ETH/BTC (most liquid and correlated)
  const pair = POPULAR_PAIRS[0]; // ETH/BTC

  // Use a small amount (minimum $10, maximum $50 for first trade)
  const safeAmount = Math.max(10, Math.min(amount * 0.1, 50));

  return {
    pair,
    params: {
      pair: pair.id,
      asset1: pair.asset1,
      asset2: pair.asset2,
      amount: safeAmount,
      direction: "long-short", // Default: Long ETH, Short BTC
      leverage: 1, // No leverage for beginners
    },
    rationale:
      "ETH/BTC is a classic pair trade with high liquidity and correlation. " +
      "This trade captures relative performance between the two largest crypto assets. " +
      `Starting with $${safeAmount.toFixed(2)} allows you to learn without significant risk.`,
  };
}

/**
 * Validate pair trade parameters
 */
export function validatePairTradeParams(params: PairTradeParams): {
  valid: boolean;
  error?: string;
} {
  // Minimum trade amount: $10
  if (params.amount < 10) {
    return {
      valid: false,
      error: "Minimum pair trade amount is $10 USD",
    };
  }

  // Maximum leverage: 5x for pair trades (conservative)
  if (params.leverage && params.leverage > 5) {
    return {
      valid: false,
      error: "Maximum leverage for pair trades is 5x",
    };
  }

  // Validate direction
  if (
    params.direction !== "long-short" &&
    params.direction !== "short-long"
  ) {
    return {
      valid: false,
      error: "Invalid trade direction. Use 'long-short' or 'short-long'",
    };
  }

  return { valid: true };
}

/**
 * Format pair trade for display
 */
export function formatPairTrade(params: PairTradeParams): string {
  const [longAsset, shortAsset] =
    params.direction === "long-short"
      ? [params.asset1, params.asset2]
      : [params.asset2, params.asset1];

  return `Long ${longAsset} / Short ${shortAsset} ($${params.amount.toFixed(2)})`;
}

/**
 * Calculate estimated fees for pair trade
 * 
 * Pear Protocol charges fees on both legs of the trade
 */
export function estimatePairTradeFees(amount: number): {
  pearFee: number; // Pear Protocol fee
  hyperliquidFee: number; // Hyperliquid execution fee
  totalFee: number;
} {
  // Pear Protocol fee: ~0.1% of notional value (both legs)
  const pearFee = amount * 0.001;

  // Hyperliquid execution: ~0.02% maker fee per leg (2 legs)
  const hyperliquidFee = amount * 0.0002 * 2;

  return {
    pearFee: parseFloat(pearFee.toFixed(4)),
    hyperliquidFee: parseFloat(hyperliquidFee.toFixed(4)),
    totalFee: parseFloat((pearFee + hyperliquidFee).toFixed(4)),
  };
}

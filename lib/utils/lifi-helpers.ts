import { getChains, getTokens } from "@lifi/sdk";
import type { Chain, Token } from "@lifi/sdk";

// Cache for chains and tokens
let chainsCache: Chain[] | null = null;
const tokensCache: Map<number, Token[]> = new Map();

/**
 * Get all supported chains from LI.FI
 */
export async function getSupportedChains(): Promise<Chain[]> {
  if (chainsCache) {
    return chainsCache;
  }

  try {
    const chains = await getChains();
    chainsCache = chains;
    return chains;
  } catch (error) {
    console.error("Error fetching chains:", error);
    return [];
  }
}

/**
 * Get tokens for a specific chain
 */
export async function getTokensForChain(chainId: number): Promise<Token[]> {
  if (tokensCache.has(chainId)) {
    console.log(`Using cached tokens for chain ${chainId}`);
    return tokensCache.get(chainId)!;
  }

  try {
    console.log(`Fetching tokens for chain ${chainId}...`);

    // The LI.FI SDK getTokens returns: { tokens: { [chainId]: Token[] }, extended: boolean }
    const result = await getTokens();
    console.log("✓ Got response from LI.FI getTokens()");

    // Extract tokens for the specific chain
    let tokensList: Token[] = [];

    if (result && typeof result === "object" && "tokens" in result) {
      const tokensObj = result as { tokens?: Record<number, Token[]> };

      // Access tokens by chainId key
      if (tokensObj.tokens && tokensObj.tokens[chainId]) {
        tokensList = tokensObj.tokens[chainId];
        console.log(`✓ Found ${tokensList.length} tokens for chain ${chainId}`);
      } else {
        console.warn(`⚠ No tokens found for chain ${chainId} in response`);
        console.log(
          "Available chains:",
          Object.keys(tokensObj.tokens || {}).join(", ")
        );
      }
    } else {
      console.error("❌ Unexpected response format from getTokens():", result);
    }

    tokensCache.set(chainId, tokensList);
    return tokensList;
  } catch (error) {
    console.error(`Error fetching tokens for chain ${chainId}:`, error);
    return [];
  }
}

/**
 * Find a token by address on a specific chain
 */
export async function findToken(
  chainId: number,
  tokenAddress: string
): Promise<Token | undefined> {
  const tokens = await getTokensForChain(chainId);
  return tokens.find(
    (token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
  );
}

/**
 * Get popular/featured tokens for quick selection
 */
export async function getFeaturedTokens(chainId: number): Promise<Token[]> {
  const allTokens = await getTokensForChain(chainId);

  console.log(
    `getFeaturedTokens: Processing ${allTokens.length} tokens for chain ${chainId}`
  );
  console.log(
    "allTokens type:",
    typeof allTokens,
    "isArray:",
    Array.isArray(allTokens)
  );

  if (!Array.isArray(allTokens)) {
    console.error("allTokens is not an array:", allTokens);
    return [];
  }

  if (allTokens.length === 0) {
    console.warn(`No tokens found for chain ${chainId}`);
    return [];
  }

  // Filter for commonly used tokens (USDC, USDT, ETH, WBTC, etc.)
  const featuredSymbols = [
    "ETH",
    "USDC",
    "USDT",
    "WBTC",
    "DAI",
    "WETH",
    "MATIC",
    "BNB",
    "USDC.e",
  ];

  const featured = allTokens.filter((token) =>
    featuredSymbols.includes(token.symbol.toUpperCase())
  );

  console.log(`Found ${featured.length} featured tokens`);

  // If no featured tokens found, return the first 10 tokens with highest priceUSD
  if (featured.length === 0) {
    console.log(
      `No featured tokens found for chain ${chainId}, returning top 10`
    );

    const sorted = allTokens
      .filter((token) => token.priceUSD && parseFloat(token.priceUSD) > 0)
      .sort(
        (a, b) => parseFloat(b.priceUSD || "0") - parseFloat(a.priceUSD || "0")
      )
      .slice(0, 10);

    console.log(`Returning ${sorted.length} top tokens by price`);
    return sorted;
  }

  return featured;
}

/**
 * Format token amount with proper decimals
 * Converts from Wei (smallest unit) to human-readable format
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  try {
    // Parse as BigInt to handle large numbers
    const amountBigInt = BigInt(amount);

    // Convert from Wei to human-readable (divide by 10^decimals)
    const divisor = BigInt(10 ** decimals);
    const wholePart = amountBigInt / divisor;
    const fractionalPart = amountBigInt % divisor;

    // Format with decimals
    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    const formatted = `${wholePart}.${fractionalStr}`;

    // Parse to float and format with max 6 decimal places
    const value = parseFloat(formatted);
    return value.toFixed(Math.min(6, decimals));
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return "0";
  }
}

/**
 * Parse user input amount to wei (smallest unit)
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount);
  if (isNaN(value) || value <= 0) return "0";

  // Convert to smallest unit (wei)
  const amountInWei = BigInt(Math.floor(value * 10 ** decimals));

  return amountInWei.toString();
}

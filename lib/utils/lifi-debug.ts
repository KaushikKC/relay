/**
 * Debug utilities for LI.FI integration
 */

import { getChains, getTokens } from "@lifi/sdk";

/**
 * Test LI.FI API connectivity and data format
 */
export async function debugLiFiAPI() {
  console.log("=== LI.FI API Debug ===");
  
  try {
    // Test 1: Get chains
    console.log("Test 1: Fetching chains...");
    const chains = await getChains();
    console.log("Chains response type:", typeof chains);
    console.log("Chains is array:", Array.isArray(chains));
    console.log("Chains count:", Array.isArray(chains) ? chains.length : "N/A");
    if (Array.isArray(chains) && chains.length > 0) {
      console.log("First chain:", chains[0]);
    }
    
    // Test 2: Get tokens (all chains, then filter for Ethereum)
    console.log("\nTest 2: Fetching tokens (all chains)...");
    const ethTokensResult = await getTokens();
    console.log("Tokens response type:", typeof ethTokensResult);
    console.log("Tokens response:", ethTokensResult);
    console.log("Has 'tokens' property:", 'tokens' in (ethTokensResult || {}));
    
    if (ethTokensResult && typeof ethTokensResult === 'object' && 'tokens' in ethTokensResult) {
      const tokensObj = ethTokensResult as { tokens?: Record<number, unknown[]> };
      const ethTokens = tokensObj.tokens?.[1] || [];
      console.log("Ethereum tokens array length:", Array.isArray(ethTokens) ? ethTokens.length : "Not an array");
      if (Array.isArray(ethTokens) && ethTokens.length > 0) {
        console.log("First Ethereum token:", ethTokens[0]);
      }
    }
    
    console.log("=== Debug Complete ===");
    return true;
  } catch (error) {
    console.error("Debug error:", error);
    return false;
  }
}

/**
 * Test token fetching for a specific chain
 */
export async function debugChainTokens(chainId: number) {
  console.log(`\n=== Debugging tokens for chain ${chainId} ===`);
  
  try {
    const result = await getTokens();
    console.log("Raw result:", result);
    console.log("Result type:", typeof result);
    console.log("Result keys:", Object.keys(result || {}));
    
    if (result && typeof result === 'object' && 'tokens' in result) {
      const tokensObj = result as { tokens?: Record<number, unknown[]> };
      const chainTokens = tokensObj.tokens?.[chainId] || [];
      console.log(`Tokens for chain ${chainId}:`, chainTokens.length);
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching tokens for chain ${chainId}:`, error);
    throw error;
  }
}

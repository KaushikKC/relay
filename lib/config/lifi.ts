import { createConfig, EVM } from "@lifi/sdk";
import type { WalletClient } from "viem";

// Global wallet client reference for LI.FI SDK
let globalWalletClient: WalletClient | null = null;

// Set the wallet client for LI.FI SDK to use
export const setLiFiWalletClient = (walletClient: WalletClient | null) => {
  globalWalletClient = walletClient;
  console.log("LI.FI wallet client set:", !!walletClient);
};

// Initialize LI.FI SDK
export const initializeLiFi = () => {
  try {
    console.log("Initializing LI.FI SDK...");
    createConfig({
      integrator: "hyperliquid-relay", // Max 23 chars, alphanumeric + "-", "_", "."
      apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY, // Optional but recommended
      providers: [
        EVM({
          getWalletClient: async () => {
            if (!globalWalletClient) {
              throw new Error(
                "Wallet client not set. Please connect your wallet."
              );
            }
            return globalWalletClient;
          },
        }),
      ],
    });
    console.log("LI.FI SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize LI.FI SDK:", error);
  }
};

// Chain IDs for LI.FI
export const CHAIN_IDS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  POLYGON: 137,
  BSC: 56,
  HYPEREVM: 999,
} as const;

// Destination types for bridging
export type DestinationType = "hyperevm" | "hyperliquid";

// Destination configuration
export const DESTINATIONS = {
  hyperevm: {
    name: "HyperEVM",
    description: "Bridge to HyperEVM chain for DeFi activities",
    chainId: CHAIN_IDS.HYPEREVM,
    icon: "🔷",
  },
  hyperliquid: {
    name: "Hyperliquid Exchange",
    description: "Deposit directly to your Hyperliquid trading account",
    chainId: CHAIN_IDS.ARBITRUM, // Bridge to Arbitrum first, then deposit to Hyperliquid
    icon: "📈",
    requiresSecondStep: true, // Indicates two-step flow
  },
} as const;

// Popular tokens on each chain (for quick selection)
export const POPULAR_TOKENS: Record<number, string[]> = {
  [CHAIN_IDS.ETHEREUM]: [
    "0x0000000000000000000000000000000000000000", // ETH
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  ],
  [CHAIN_IDS.ARBITRUM]: [
    "0x0000000000000000000000000000000000000000", // ETH
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
  ],
  [CHAIN_IDS.BASE]: [
    "0x0000000000000000000000000000000000000000", // ETH
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
  ],
  [CHAIN_IDS.OPTIMISM]: [
    "0x0000000000000000000000000000000000000000", // ETH
    "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // USDC
    "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT
  ],
  [CHAIN_IDS.POLYGON]: [
    "0x0000000000000000000000000000000000001010", // MATIC
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
  ],
  [CHAIN_IDS.BSC]: [
    "0x0000000000000000000000000000000000000000", // BNB
    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
    "0x55d398326f99059fF775485246999027B3197955", // USDT
  ],
  [CHAIN_IDS.HYPEREVM]: [
    "0x0000000000000000000000000000000000000000", // ETH
  ],
};

// Destination tokens on HyperEVM (for the hackathon, focusing on USDC)
export const HYPEREVM_DESTINATION_TOKENS = [
  {
    address: "0x0000000000000000000000000000000000000000", // Native ETH on HyperEVM
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    chainId: CHAIN_IDS.HYPEREVM,
  },
  // Add USDC and HYPE token addresses when available on HyperEVM
  // {
  //   address: '0x...', // USDC on HyperEVM
  //   symbol: 'USDC',
  //   name: 'USD Coin',
  //   decimals: 6,
  //   chainId: CHAIN_IDS.HYPEREVM,
  // },
];

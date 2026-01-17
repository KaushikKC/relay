import { http, createConfig } from "wagmi";
import { mainnet, arbitrum, base, optimism, polygon, bsc } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import type { CreateConnectorFn } from "wagmi";

// HyperEVM Chain Configuration
export const hyperEVM = {
  id: 999,
  name: "HyperEVM",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://api.hyperliquid.xyz/evm"] },
    public: { http: ["https://api.hyperliquid.xyz/evm"] },
  },
  blockExplorers: {
    default: {
      name: "HyperEVMScan",
      url: "https://hyperevmscan.io",
    },
  },
  testnet: false,
} as const;

// Get WalletConnect project ID (optional)
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Build connectors array - only include WalletConnect if project ID is valid
// A valid project ID should be 32 characters and not all zeros
const hasValidWalletConnectId =
  walletConnectProjectId &&
  walletConnectProjectId.length === 32 &&
  walletConnectProjectId !== "0".repeat(32);

const connectors: CreateConnectorFn[] = [injected()];

// Only add WalletConnect if a valid project ID is provided
if (hasValidWalletConnectId) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
    }) as CreateConnectorFn
  );
  console.log("✅ WalletConnect enabled with project ID");
} else {
  console.warn(
    "⚠️ WalletConnect disabled - No valid NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID found. Using injected wallets only (MetaMask, etc.)"
  );
}

// Wagmi Configuration
export const config = createConfig({
  chains: [mainnet, arbitrum, base, optimism, polygon, bsc, hyperEVM],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [hyperEVM.id]: http(),
  },
});

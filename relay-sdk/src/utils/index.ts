// Utility exports for the SDK
// Note: These paths are relative to relay-sdk/src/utils/index.ts
// Utils are located in the parent directory's lib/utils folder
export {
  getSupportedChains,
  getTokensForChain,
  getFeaturedTokens,
  formatTokenAmount,
} from "../../../lib/utils/lifi-helpers";

export { mapRouteToSteps } from "../../../lib/utils/bridgeSteps";

export {
  loadBridgeState,
  saveBridgeState,
  clearBridgeState,
  saveDetailedBridgeState,
} from "../../../lib/utils/transactionPersistence";

export {
  getBridgeAddresses,
  getUSDCPermitDomain,
  parseUSDCAmount,
  validateDepositAmount,
  ERC20_ABI,
  BRIDGE2_ABI,
  BRIDGE_ADDRESS_MAINNET,
  BRIDGE_ADDRESS_TESTNET,
  USDC_ADDRESS_MAINNET,
  USDC_ADDRESS_TESTNET,
  ARBITRUM_MAINNET,
  ARBITRUM_TESTNET,
  USDC_DECIMALS,
} from "../../../lib/utils/hyperliquid-bridge";

export * from "../../../lib/utils/pear-api";

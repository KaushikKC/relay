// Type exports for the SDK
// Note: These paths are relative to relay-sdk/src/types/index.ts
export type {
  BridgeState,
  BridgeStatus,
  BridgeStep,
  StepStatus,
} from "../../../lib/hooks/useLiFiBridge";

export type {
  HyperliquidDepositState,
  HyperliquidDepositStatus,
  HyperliquidStep,
  HLStepStatus,
} from "../../../lib/hooks/useHyperliquidDeposit";

// Note: useHyperliquidBalance doesn't export a named type
// The return type can be inferred from the hook

export type {
  PersistedBridgeState,
} from "../../../lib/utils/transactionPersistence";

// LI.FI SDK types re-export
export type { Route, Token, Chain, LiFiStep } from "@lifi/sdk";

// Wagmi types re-export
export type { Address } from "viem";

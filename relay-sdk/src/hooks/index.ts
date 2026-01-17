// Hook exports for the SDK
// Note: These paths are relative to relay-sdk/src/hooks/index.ts
// Hooks are located in the parent directory's lib/hooks folder
export { useLiFiBridge } from "../../../lib/hooks/useLiFiBridge";
export { useHyperliquidDeposit } from "../../../lib/hooks/useHyperliquidDeposit";
export { useHyperliquidBalance } from "../../../lib/hooks/useHyperliquidBalance";
export { useTokenBalance } from "../../../lib/hooks/useTokenBalance";
export {
  useSwipeGesture,
  useIsMobile,
} from "../../../lib/hooks/useSwipeGesture";

// Re-export hook types
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
} from "../../../lib/hooks/useHyperliquidDeposit";

// Re-export HyperliquidBalance type
export type { HyperliquidBalance } from "../../../lib/hooks/useHyperliquidBalance";

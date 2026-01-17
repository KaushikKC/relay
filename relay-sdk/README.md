# relay-bridge-sdk

Seamlessly bridge assets to HyperEVM and Hyperliquid with a single integration.

## Features

- **One-Click Bridging**: Bridge from any chain to HyperEVM with optimal routes
- **Auto-Deposit**: Automatically deposit bridged funds to Hyperliquid trading account
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Real-Time Updates**: Monitor bridge progress with live status updates
- **Error Recovery**: Built-in failure handling and transaction resumption
- **Mobile-First**: Optimized for mobile wallets and touch interfaces

## Installation

```bash
npm install relay-bridge-sdk wagmi viem
```

Or with yarn:
```bash
yarn add relay-bridge-sdk wagmi viem
```

Or with pnpm:
```bash
pnpm add relay-bridge-sdk wagmi viem
```

## Quick Start

### 1. Setup Web3 Provider

```tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from 'relay-bridge-sdk';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 2. Use the Bridge Widget

```tsx
import { BridgeWidget } from 'relay-bridge-sdk/components';

function MyBridgePage() {
  return (
    <div>
      <h1>Bridge to HyperEVM</h1>
      <BridgeWidget />
    </div>
  );
}
```

### 3. Or Build Your Custom UI with Hooks

```tsx
import { useLiFiBridge, useHyperliquidDeposit } from 'relay-bridge-sdk/hooks';
import { CHAIN_IDS } from 'relay-bridge-sdk';
import { useState } from 'react';

function CustomBridge() {
  const [amount, setAmount] = useState('100');
  const { fetchRoute, executeBridge, bridgeState } = useLiFiBridge();
  const { executeDeposit, hyperliquidState } = useHyperliquidDeposit();

  const handleBridge = async () => {
    // Fetch route
    const route = await fetchRoute({
      fromChain: CHAIN_IDS.BASE,
      toChain: CHAIN_IDS.HYPEREVM,
      fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      amount: amount,
    });

    // Execute bridge
    await executeBridge(route);

    // Optionally deposit to Hyperliquid
    await executeDeposit(route);
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <button onClick={handleBridge}>
        Bridge to HyperEVM
      </button>
      
      {bridgeState.status === 'executing' && (
        <div>Bridging... Step {bridgeState.currentStepIndex + 1} of {bridgeState.steps.length}</div>
      )}
      
      {bridgeState.status === 'success' && (
        <div>Bridge Complete!</div>
      )}
    </div>
  );
}
```

## Components

### BridgeWidget

Full-featured bridge widget with built-in UI, wallet connection, and error handling.

```tsx
import { BridgeWidget } from 'relay-bridge-sdk/components';

<BridgeWidget
  defaultFromChain={8453} // Base
  defaultToChain={999} // HyperEVM
  onSuccess={(txHash) => console.log('Bridge complete:', txHash)}
  onError={(error) => console.error('Bridge failed:', error)}
/>
```

### DepositToHyperliquid

Component for depositing funds from Arbitrum to Hyperliquid trading account.

```tsx
import { DepositToHyperliquid } from 'relay-bridge-sdk/components';

<DepositToHyperliquid
  amount="100"
  onSuccess={(txHash) => console.log('Deposit complete:', txHash)}
  onCancel={() => console.log('Deposit cancelled')}
/>
```

## Hooks

### useLiFiBridge

Main hook for bridging operations.

```tsx
import { useLiFiBridge } from 'relay-bridge-sdk/hooks';

const {
  bridgeState,
  fetchRoute,
  executeBridge,
  retryStep,
} = useLiFiBridge();
```

**Returns:**
- `bridgeState: BridgeState` - Current bridge state
- `fetchRoute: (params) => Promise<Route>` - Fetch bridge route
- `executeBridge: (route) => Promise<void>` - Execute bridge
- `retryStep: (stepIndex) => Promise<void>` - Retry failed step

### useHyperliquidDeposit

Hook for depositing to Hyperliquid.

```tsx
import { useHyperliquidDeposit } from 'relay-bridge-sdk/hooks';

const {
  hyperliquidState,
  fetchHyperliquidRoute,
  executeDeposit,
} = useHyperliquidDeposit();
```

**Returns:**
- `hyperliquidState: HyperliquidDepositState` - Current deposit state
- `fetchHyperliquidRoute: (params) => Promise<Route>` - Fetch deposit route
- `executeDeposit: (route) => Promise<void>` - Execute deposit

### useHyperliquidBalance

Hook for fetching Hyperliquid account balance.

```tsx
import { useHyperliquidBalance } from 'relay-bridge-sdk/hooks';
import { useAccount } from 'wagmi';

function BalanceDisplay() {
  const { address } = useAccount();
  const {
    totalUsdcBalance,
    perpBalance,
    spotBalances,
    isLoading,
  } = useHyperliquidBalance(address);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Total USDC: {totalUsdcBalance.toFixed(2)}</p>
      <p>Perp Account: {perpBalance.toFixed(2)}</p>
      <p>Spot USDC: {spotBalances.USDC?.toFixed(2) || '0.00'}</p>
    </div>
  );
}
```

## Utilities

### formatTokenAmount

Format token amounts from Wei to human-readable format.

```tsx
import { formatTokenAmount } from 'relay-bridge-sdk/utils';

const formatted = formatTokenAmount('1000000', 6); // "1.00" (for USDC)
```

### getFeaturedTokens

Get popular tokens for a specific chain.

```tsx
import { getFeaturedTokens } from 'relay-bridge-sdk/utils';

const tokens = await getFeaturedTokens(8453); // Get featured tokens on Base
```

## Configuration

### Chain IDs

```typescript
import { CHAIN_IDS } from 'relay-bridge-sdk';

CHAIN_IDS.ETHEREUM    // 1
CHAIN_IDS.ARBITRUM    // 42161
CHAIN_IDS.BASE        // 8453
CHAIN_IDS.OPTIMISM    // 10
CHAIN_IDS.POLYGON     // 137
CHAIN_IDS.BSC         // 56
CHAIN_IDS.HYPEREVM    // 999
```

## Full Integration Example

### Bridge to Hyperliquid with Auto-Deposit

```tsx
import { useHyperliquidDeposit } from 'relay-bridge-sdk/hooks';
import { CHAIN_IDS } from 'relay-bridge-sdk';

function FullBridgeFlow() {
  const { fetchHyperliquidRoute, executeDeposit, hyperliquidState } = useHyperliquidDeposit();

  const handleBridgeAndDeposit = async () => {
    // 1. Fetch route to Hyperliquid (via Arbitrum)
    const route = await fetchHyperliquidRoute({
      fromChain: CHAIN_IDS.BASE,
      fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      amount: '100', // 100 USDC
    });

    // 2. Execute the complete flow (bridge + deposit)
    await executeDeposit(route);

    // Done! Funds are now in Hyperliquid trading account
  };

  return (
    <div>
      <button onClick={handleBridgeAndDeposit}>
        Bridge & Deposit to Hyperliquid
      </button>
      
      {hyperliquidState.status === 'executing' && (
        <div>
          {hyperliquidState.steps.map((step, i) => (
            <div key={i}>
              {step.title}: {step.status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Documentation

For complete documentation, examples, and API reference, visit:

**[Full Documentation](https://relay-lifi.vercel.app/docs)**

**[Developer Playground](https://relay-lifi.vercel.app/dev)**

## Support

- Docs: https://relay-lifi.vercel.app/docs

## License

MIT © Relay Team

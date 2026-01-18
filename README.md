# Relay - Hyperliquid Bridge

One-click cross-chain bridge to HyperEVM and Hyperliquid powered by LI.FI.

## Quick Links

- **Live App**: [https://relay-lifi.vercel.app](https://relay-lifi.vercel.app)
- **Demo Video**: [https://youtu.be/igsIav8V2Hk](https://youtu.be/igsIav8V2Hk)
- **NPM Package**: [relay-bridge-sdk](https://www.npmjs.com/package/relay-bridge-sdk)
- **Documentation**: [https://relay-lifi.vercel.app/docs](https://relay-lifi.vercel.app/docs)
- **Developer Playground**: [https://relay-lifi.vercel.app/dev](https://relay-lifi.vercel.app/dev)
- **GitHub**: [https://github.com/KaushikKC/relay](https://github.com/KaushikKC/relay)

## Overview

Relay is a production-ready bridge dApp that simplifies onboarding to HyperEVM and Hyperliquid from any supported chain. It provides a seamless, failure-resilient bridging experience with intelligent gas management, transaction persistence, and optional auto-deposit to Hyperliquid trading accounts.

## Features

### Core Bridging

- **Cross-Chain Bridging**: Bridge from any supported chain to HyperEVM or directly to Hyperliquid
- **Smart Routing**: Automatic route optimization via LI.FI SDK
- **Dual Destination Support**: Choose between HyperEVM (DeFi) or Hyperliquid (Trading)
- **Destination Token Selection**: Choose destination token on HyperEVM (USDC, HYPE, ETH, or any supported asset)
- **Real-Time Tracking**: Step-by-step progress visualization with transaction hashes
- **Transaction Persistence**: Resume interrupted bridges after page refresh
- **Route Details**: See quote, ETA, steps, gas costs, and final amount before executing

### Hyperliquid Integration

- **Direct Deposit Flow**: Bridge directly to Hyperliquid trading accounts
- **Auto-Deposit**: Optional automatic deposit to Hyperliquid after bridging
- **Gas Bundling**: Automatically bridges small ETH to Arbitrum for deposit gas fees
- **Minimum Deposit Validation**: Enforces 5 USDC minimum deposit requirement
- **Post-Bridge Dashboard**: Enhanced dashboard with trading pair suggestions via Pear API
- **Post-Deposit Dashboard**: Complete trading dashboard showing balance, status, and trading suggestions
- **Hyperliquid Balance Integration**: Real-time balance fetching from Hyperliquid API

### Failure Resilience

- **Resume Bridge**: Continue interrupted transactions from where they left off
- **Partial Failure Recovery**: Clear guidance when bridges fail mid-execution
- **Error Recovery**: Detailed error messages with retry options
- **Step Retry**: Retry individual failed steps without restarting the entire flow
- **Transaction State Persistence**: All bridge state saved to localStorage

### User Experience

- **Mobile-First Design**: Optimized for mobile devices with touch-friendly UI
- **Swipe Gestures**: Navigate with swipe gestures on mobile
- **Onboarding Intelligence**: Context-aware suggestions after successful bridges
- **Beautiful UI**: Cyberpunk-themed glassmorphism design with 3D backgrounds
- **Fast & Efficient**: Optimized for speed and minimal gas costs
- **Post-Bridge Guidance**: Two distinct dashboards - one for HyperEVM bridge, one for Hyperliquid deposit
- **Trading Integration**: Pear Protocol API for one-click pair trading

### Advanced Features

- **Gas Reserve Management**: Automatically checks Arbitrum ETH balance and bridges gas only when needed
- **Step-by-Step Progress**: Detailed visualization of each bridge step with status (pending/in-progress/success/failed)
- **Route Preview**: See estimated time, gas costs, steps, and final amount before executing
- **Token Selection**: Support for multiple tokens on source and destination chains (USDC, HYPE, ETH, etc.)
- **Balance Display**: Real-time token balance with "Max" button
- **Destination Token Selection**: Users can choose USDC, HYPE, ETH, or any supported asset on HyperEVM
- **Hyperliquid Balance Integration**: Real-time balance fetching and display after deposit

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Web3**: Wagmi, Viem
- **Bridging**: LI.FI SDK v3.15.1
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js (Hyperspeed effect)
- **State Management**: React Hooks with localStorage persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/KaushikKC/relay.git
cd relay/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)

**Note**: LI.FI SDK works without an API key, but you can optionally add `NEXT_PUBLIC_LIFI_API_KEY` for higher rate limits.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Basic Bridge Flow

1. **Connect Wallet**: Click "Connect Wallet" in the navigation bar
2. **Select Destination**: Choose "Hyperliquid Exchange" or "HyperEVM"
3. **Select Origin Chain & Token**: Choose your origin chain (Base, Ethereum, etc.) and token (USDC, ETH, etc.)
4. **Select Destination Token**: Choose destination token on HyperEVM (USDC, HYPE, ETH, or any supported asset)
5. **Enter Amount**: Specify the amount to bridge
6. **Get Quote**: Click "Get Quote" to see the best route with quote, ETA, steps, gas costs, and final amount
7. **Execute**: Review route details and confirm the transaction
8. **Track**: Monitor your transaction status in real-time with step-by-step progress
9. **Post-Bridge**: See dashboard with next steps (deposit, trade, or explore)

### Hyperliquid Deposit Flow

When selecting "Hyperliquid Exchange" as destination:

1. Bridge automatically routes to Arbitrum USDC
2. Gas bundling checks Arbitrum ETH balance
3. If needed, bridges small ETH (~$0.50) for deposit gas
4. After USDC arrives on Arbitrum, deposit to Hyperliquid Bridge2 contract
5. Funds credited to your Hyperliquid trading account in < 1 minute

**Minimum Deposit**: 5 USDC (enforced by Hyperliquid)

### Resuming Interrupted Bridges

If you refresh the page during a bridge:

1. The app detects pending transactions
2. Shows a resume dialog with transaction details
3. Click "Resume" to continue from where it left off
4. All step progress is preserved

### Handling Partial Failures

If a bridge fails mid-execution:

1. The app identifies which steps completed successfully
2. Shows where your funds are located
3. Provides clear recovery options:
   - Retry the failed step
   - View funds on block explorer
   - Start a new bridge

## Architecture

### Key Components

- **`BridgeWidget`**: Main bridging interface with destination selection
- **`useLiFiBridge`**: Custom hook for HyperEVM bridging via LI.FI
- **`useHyperliquidDeposit`**: Custom hook for Hyperliquid deposit flow
- **`BridgeProgress`**: Step-by-step progress visualization with per-step status
- **`PostBridgeDashboard`**: Enhanced post-bridge screen after HyperEVM bridge with deposit and trading options
- **`PostDepositDashboard`**: Complete trading dashboard after Hyperliquid deposit with balance, status, and trading suggestions
- **`ErrorRecovery`**: Comprehensive error handling and recovery with actionable suggestions
- **`ResumeBridgeDialog`**: Resume interrupted transactions after page refresh
- **`PartialFailureRecovery`**: Handle partial bridge failures with funds location tracking
- **`DepositToHyperliquid`**: Standalone reusable deposit component (exported in SDK)
- **`MobileWalletConnect`**: Mobile-optimized wallet connection with deep linking

### Key Utilities

- **`transactionPersistence.ts`**: Save/load bridge state from localStorage with route data and step progress
- **`bridgeSteps.ts`**: Map LI.FI routes to step-by-step progress with status tracking
- **`hyperliquid-bridge.ts`**: Hyperliquid Bridge2 contract integration with gas bundling
- **`hyperliquid-deposit.ts`**: Deposit utilities with minimum amount validation
- **`pear-api.ts`**: Pear Protocol API integration for trading pairs and one-click trade execution
- **`lifi-helpers.ts`**: LI.FI SDK helper functions for chains, tokens, and formatting
- **`useHyperliquidBalance.ts`**: Hook for fetching real-time Hyperliquid account balances

### Flow Diagrams

#### HyperEVM Bridge Flow
```
User Input → LI.FI Route Fetching → Route Preview → 
Execution → Step-by-Step Progress → Bridge Transaction → Complete
```

#### Hyperliquid Deposit Flow
```
User Input → LI.FI Route Fetching → Gas Balance Check → 
(If needed) Gas Bridge → USDC Bridge to Arbitrum → 
USDC Transfer to Bridge2 → Hyperliquid Credit → Complete
```

## Supported Chains

### Source Chains
- Ethereum (Mainnet)
- Arbitrum
- Base
- Optimism
- Polygon
- BSC

### Destination Chains
- **HyperEVM** (Chain ID: 999)
- **Arbitrum** (for Hyperliquid deposits, Chain ID: 42161)

## Hyperliquid Integration

### Bridge2 Contract

- **Mainnet**: `0x2df1c51e09aecf9cacb7bc98cb1742757f163df7`
- **Testnet**: `0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89`

### Deposit Mechanism

The deposit flow uses a simple USDC transfer to the Bridge2 contract:
1. User approves USDC (if needed)
2. User transfers USDC directly to Bridge2 contract address
3. Validators on L1 listen for Transfer events
4. Funds credited to user's Hyperliquid account in < 1 minute

**Important**: Minimum deposit is 5 USDC. Amounts below this will not be credited.

### Gas Bundling

To ensure deposits complete successfully, the app:
1. Checks Arbitrum ETH balance before bridging
2. If balance < 0.00003 ETH (~$0.10), bridges small ETH (~$0.50)
3. Reserves this ETH exclusively for deposit gas fees
4. Prevents deposit failures due to insufficient gas

## LI.FI Integration

This project uses the [LI.FI SDK](https://docs.li.fi/) for cross-chain bridging:

- **Route Optimization**: Finds the best route across bridges and DEXs
- **Multi-Step Execution**: Handles complex swap + bridge flows
- **Status Tracking**: Real-time transaction monitoring
- **Error Handling**: Graceful failure recovery
- **EVM Provider**: Dynamic wallet client integration

### Example Usage

```typescript
import { getRoutes, executeRoute } from '@lifi/sdk';

// Fetch routes
const routes = await getRoutes({
  fromChainId: 8453, // Base
  toChainId: 42161,  // Arbitrum
  fromTokenAddress: '0x...',
  toTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
  fromAmount: '1000000000',
  fromAddress: userAddress,
});

// Execute best route
await executeRoute(routes.routes[0], {
  updateRouteHook: (updatedRoute) => {
    // Handle progress updates
  },
  switchChainHook: async (chainId) => {
    // Handle chain switching
  }
});
```

## HyperEVM Integration

### Chain Details

- **Chain ID**: 999
- **RPC URL**: `https://api.hyperliquid.xyz/evm` (Mainnet)
- **Explorer**: `https://hyperevmscan.io`

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Project Structure

```
relay/frontend/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── BridgeWidget.tsx    # Main bridge interface
│   ├── BridgeProgress.tsx  # Step progress visualization
│   ├── PostBridgeDashboard.tsx # Post-bridge dashboard
│   └── ...
├── lib/
│   ├── config/            # Configuration files
│   ├── hooks/             # Custom React hooks
│   ├── providers/         # Context providers
│   └── utils/             # Utility functions
└── public/                # Static assets
```

## Troubleshooting

### Common Issues

1. **"No routes found"**: 
   - Check that you have sufficient balance
   - Verify the token is supported on the origin chain
   - Try a different amount or token
   - Ensure destination chain (HyperEVM/Arbitrum) is supported by LI.FI

2. **Transaction fails**:
   - Ensure you have enough native tokens for gas
   - Check slippage tolerance
   - Verify wallet is connected to the correct network
   - For Hyperliquid deposits, ensure you have ETH on Arbitrum for gas

3. **Slow bridging**:
   - Cross-chain bridges can take 2-30 minutes depending on the route
   - Check transaction status on the block explorer
   - Gas bundling adds an extra step but ensures deposit success

4. **"Wallet not connected"**:
   - Refresh the page
   - Disconnect and reconnect your wallet
   - Check browser console for wallet extension errors
   - Ensure WalletConnect Project ID is set in `.env.local`

5. **Gas bridge always executes**:
   - The app checks Arbitrum ETH balance before bridging
   - If you have >= 0.00003 ETH on Arbitrum, gas bridge is skipped
   - Check console logs for balance information

## Resources

- **SDK Package**: [relay-bridge-sdk on npm](https://www.npmjs.com/package/relay-bridge-sdk)
- [LI.FI Documentation](https://docs.li.fi/)
- [Hyperliquid Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/)
- [HyperEVM Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [Pear Protocol API](https://docs.pearprotocol.io/api-integration/overview)


## Post-Bridge Dashboards

Relay provides two distinct post-bridge experiences optimized for different user journeys:

### PostBridgeDashboard (After HyperEVM Bridge)

Shown after successful bridge to HyperEVM:
- Success confirmation with bridged amount
- HyperEVM balance display
- Transaction explorer link
- Primary action: "Deposit to Hyperliquid" button
- Secondary action: "Open First Pair Trade" (Pear API integration)
- Links to explore Hyperliquid features (Spot, Perpetuals, Vaults)

### PostDepositDashboard (After Hyperliquid Deposit)

Shown after successful deposit to Hyperliquid:
- Deposit success confirmation
- Trading account status (balance, margin available)
- Real-time balance fetching from Hyperliquid API
- Trading suggestions with risk levels (Spot, Perpetuals, Vaults)
- Quick action grid for common trading activities
- Links to Hyperliquid app for full trading suite
- Execution readiness checklist

Both dashboards provide clear next steps and guide users to their desired action.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Hackathon Submission

Built for the Hyperliquid Hackathon - Creative use of LI.FI for seamless HyperEVM and Hyperliquid onboarding.

### Requirements Met 

- **Origin Chain + Token Selection**: Users pick origin chain and token
- **Destination Token Selection**: Users pick destination token on HyperEVM (USDC, HYPE, ETH, or any supported asset)
- **LI.FI Integration**: Uses LI.FI SDK (not just redirect) for swap and bridge in one flow
- **Route Details**: Shows quote, ETA, steps, progress, and final amount
- **Execution State**: Real-time step-by-step progress with transaction hashes
- **Auto-Deposit**: Optional auto-deposit bridged USDC into Hyperliquid account

### Extra Credit Achieved 

- **Reusable Component**: `DepositToHyperliquid` component published as NPM package
- **Mobile-First Experience**: Fully optimized with swipe gestures and touch-friendly UI
- **Developer Tool**: `/dev` page with code generator and component playground

### What We Built

A production-ready bridge dApp that:

- **Simplifies Onboarding**: One-click bridge from any chain to HyperEVM or Hyperliquid
- **Destination Token Selection**: Full support for USDC, HYPE, ETH, and any supported asset on HyperEVM
- **Failure-Resilient UX**: Resume bridges, handle partial failures, clear error recovery
- **Intelligent Gas Management**: Automatic gas bundling for Hyperliquid deposits
- **Transaction Persistence**: Survive page refreshes and interruptions
- **Mobile-First Design**: Optimized for mobile with swipe gestures
- **Enhanced Post-Bridge Experience**: Two distinct dashboards - PostBridgeDashboard (HyperEVM) and PostDepositDashboard (Hyperliquid)
- **Trading Integration**: Pear Protocol API for one-click pair trading
- **Step-by-Step Tracking**: Real-time progress visualization with per-step status and retry buttons
- **Production Ready**: Comprehensive error handling, retry logic, and state management
- **Reusable SDK**: Published NPM package for other teams
- **Developer Tools**: Code generator and playground at `/dev`

### Key Differentiators

1. **Dual Destination Support**: Bridge to HyperEVM or directly to Hyperliquid
2. **Destination Token Selection**: Users can choose USDC, HYPE, ETH, or any supported asset on HyperEVM
3. **Gas Bundling**: Solves the "no gas on destination" problem automatically
4. **Failure Resilience**: Resume bridges, partial failure recovery, transaction persistence
5. **Onboarding Intelligence**: Context-aware suggestions after successful bridges
6. **Mobile Optimization**: Touch-friendly UI with swipe gestures
7. **Pear API Integration**: Trading pair suggestions and one-click trade execution
8. **Reusable SDK**: Published NPM package for other teams to integrate
9. **Developer Tools**: Code generator and component playground at `/dev`
10. **Two Post-Bridge Dashboards**: Separate optimized experiences for HyperEVM bridge vs Hyperliquid deposit

### Technical Highlights

- **LI.FI SDK Integration**: Full integration with dynamic wallet client, not just redirect
- **Hyperliquid Bridge2**: Direct integration with Bridge2 contract for deposits
- **State Persistence**: localStorage-based transaction state management with route data
- **Type Safety**: Full TypeScript coverage with proper type definitions
- **Error Handling**: Comprehensive error boundaries and recovery flows
- **Performance**: Optimized rendering and state updates
- **Step-by-Step Tracking**: Real-time progress with per-step status, tx hashes, and retry buttons
- **Hyperliquid API Integration**: Real-time balance fetching and account status
- **Pear Protocol Integration**: API integration for pair trading suggestions and execution

### Live Link

**Live Application**: [https://relay-lifi.vercel.app](https://relay-lifi.vercel.app)

**NPM Package**: [https://www.npmjs.com/package/relay-bridge-sdk](https://www.npmjs.com/package/relay-bridge-sdk)

**Documentation**: [https://relay-lifi.vercel.app/docs](https://relay-lifi.vercel.app/docs)

**Developer Playground**: [https://relay-lifi.vercel.app/dev](https://relay-lifi.vercel.app/dev)

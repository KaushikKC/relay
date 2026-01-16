# Relay - HyperEVM Bridge

One-click cross-chain bridge to HyperEVM powered by LI.FI.

## Features

- 🌉 **Cross-Chain Bridging**: Bridge from any supported chain to HyperEVM
- 🔄 **Smart Routing**: Automatic route optimization via LI.FI
- 💰 **Auto-Deposit**: Optional automatic deposit to Hyperliquid trading account
- 📊 **Transaction Tracking**: Real-time status updates and transaction monitoring
- 🎨 **Beautiful UI**: Cyberpunk-themed glassmorphism design
- ⚡ **Fast & Efficient**: Optimized for speed and minimal gas costs

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Web3**: Wagmi, Viem
- **Bridging**: LI.FI SDK
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js (Hyperspeed effect)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
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
- `NEXT_PUBLIC_LIFI_API_KEY`: Get from [LI.FI](https://li.fi/)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Connect Wallet**: Click "Connect Wallet" in the navigation bar
2. **Select Chain & Token**: Choose your origin chain and token
3. **Enter Amount**: Specify the amount to bridge
4. **Get Quote**: Click "Get Quote" to see the best route
5. **Execute**: Review and confirm the transaction
6. **Track**: Monitor your transaction status in real-time

### Auto-Deposit to Hyperliquid (Optional)

Enable the "Auto-deposit to Hyperliquid" checkbox to automatically deposit bridged funds to your Hyperliquid trading account after bridging completes.

## Architecture

### Key Components

- **`BridgeWidget`**: Main bridging interface
- **`useLiFiBridge`**: Custom hook for LI.FI integration
- **`useTokenBalance`**: Token balance management
- **Web3Provider**: Wagmi configuration wrapper

### Flow

```
User Input → LI.FI Route Fetching → Route Preview → 
Execution → Bridge Transaction → (Optional) Hyperliquid Deposit → Complete
```

## Supported Chains

- Ethereum (Mainnet)
- Arbitrum
- Base
- Optimism
- Polygon
- BSC
- HyperEVM (Destination)

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

## LI.FI Integration

This project uses the [LI.FI SDK](https://docs.li.fi/) for cross-chain bridging:

- **Route Optimization**: Finds the best route across bridges and DEXs
- **Multi-Step Execution**: Handles complex swap + bridge flows
- **Status Tracking**: Real-time transaction monitoring
- **Error Handling**: Graceful failure recovery

### Example Usage

```typescript
import { getRoutes, executeRoute } from '@lifi/sdk';

// Fetch routes
const routes = await getRoutes({
  fromChainId: 1,
  toChainId: 998,
  fromTokenAddress: '0x...',
  toTokenAddress: '0x...',
  fromAmount: '1000000000000000000',
  fromAddress: userAddress,
});

// Execute best route
await executeRoute(routes.routes[0], {
  updateRouteHook: (updatedRoute) => {
    // Handle progress updates
  }
});
```

## HyperEVM Integration

### Chain Details

- **Chain ID**: 998
- **RPC URL**: `https://api.hyperliquid-testnet.xyz/evm`
- **Explorer**: `https://explorer.hyperliquid-testnet.xyz`

### Hyperliquid Deposit

The auto-deposit feature uses the Hyperliquid bridge contract to transfer funds from HyperEVM to your Hyperliquid trading account.

**Note**: Minimum deposit is **$10 USDC** as per Hyperliquid requirements.

## Troubleshooting

### Common Issues

1. **"No routes found"**: 
   - Check that you have sufficient balance
   - Verify the token is supported on the origin chain
   - Try a different amount or token

2. **Transaction fails**:
   - Ensure you have enough native tokens for gas
   - Check slippage tolerance
   - Verify wallet is connected to the correct network

3. **Slow bridging**:
   - Cross-chain bridges can take 2-30 minutes depending on the route
   - Check transaction status on the block explorer

## Resources

- [LI.FI Documentation](https://docs.li.fi/)
- [HyperEVM Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Hackathon Submission

Built for the Hyperliquid Hackathon - Creative use of LI.FI for seamless HyperEVM onboarding.

### What We Built

A production-ready bridge dApp that:
- Simplifies HyperEVM onboarding from any chain
- Provides clear UX with real-time status updates
- Handles errors gracefully with retry logic
- Offers optional auto-deposit to Hyperliquid trading accounts
- Can be reused as a component by other teams

### Demo Video

[Link to demo video - to be added]

### Live Link

[Link to deployment - to be added]

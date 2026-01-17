"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

const codeExamples = {
  install: `npm install relay-bridge-sdk wagmi viem`,
  setup: `import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from 'relay-bridge-sdk';

const queryClient = new QueryClient();

export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}`,
  bridgeWidget: `import { BridgeWidget } from 'relay-bridge-sdk/components';

function MyBridgePage() {
  return (
    <div>
      <h1>Bridge to HyperEVM</h1>
      <BridgeWidget
        onSuccess={(txHash) => {
          console.log('Bridge complete:', txHash);
        }}
        onError={(error) => {
          console.error('Bridge failed:', error);
        }}
      />
    </div>
  );
}`,
  customBridge: `import { useLiFiBridge } from 'relay-bridge-sdk/hooks';
import { CHAIN_IDS } from 'relay-bridge-sdk';
import { useState } from 'react';

function CustomBridge() {
  const { fetchRoute, executeBridge, bridgeState } = useLiFiBridge();
  const [amount, setAmount] = useState('100');

  const handleBridge = async () => {
    // Fetch route from Base to HyperEVM
    const route = await fetchRoute({
      fromChain: CHAIN_IDS.BASE,
      toChain: CHAIN_IDS.HYPEREVM,
      fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      amount: amount,
    });

    // Execute bridge
    await executeBridge(route);
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <button onClick={handleBridge}>Bridge</button>
      
      {bridgeState.status === 'executing' && (
        <div>
          Bridging... Step {bridgeState.currentStepIndex + 1} of {bridgeState.steps.length}
        </div>
      )}
      
      {bridgeState.status === 'success' && (
        <div>Bridge complete! TX: {bridgeState.txHash}</div>
      )}
    </div>
  );
}`,
  hyperliquidDeposit: `import { useHyperliquidDeposit } from 'relay-bridge-sdk/hooks';
import { CHAIN_IDS } from 'relay-bridge-sdk';

function AutoDeposit() {
  const { fetchHyperliquidRoute, executeDeposit, hyperliquidState } = useHyperliquidDeposit();

  const handleDeposit = async () => {
    // Fetch route that bridges to Arbitrum and prepares for Hyperliquid deposit
    const route = await fetchHyperliquidRoute({
      fromChain: CHAIN_IDS.BASE,
      fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      amount: '100',
    });

    // Execute bridge + deposit flow
    await executeDeposit(route);
  };

  return (
    <div>
      <button onClick={handleDeposit}>Bridge & Deposit to Hyperliquid</button>
      
      {hyperliquidState.status === 'executing' && (
        <div>
          {hyperliquidState.currentStep === 'bridge-to-arbitrum' && 'Bridging to Arbitrum...'}
          {hyperliquidState.currentStep === 'checking-balance' && 'Checking balance...'}
          {hyperliquidState.currentStep === 'approving' && 'Approving USDC...'}
          {hyperliquidState.currentStep === 'depositing' && 'Depositing to Hyperliquid...'}
        </div>
      )}
      
      {hyperliquidState.status === 'success' && (
        <div>Deposit complete! Funds are now on Hyperliquid.</div>
      )}
    </div>
  );
}`,
  balanceCheck: `import { useHyperliquidBalance } from 'relay-bridge-sdk/hooks';
import { useAccount } from 'wagmi';

function BalanceDisplay() {
  const { address } = useAccount();
  const {
    totalUsdcBalance,
    perpBalance,
    spotBalances,
    isLoading,
    error,
  } = useHyperliquidBalance(address || undefined);

  if (isLoading) return <div>Loading balance...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Hyperliquid Balance</h3>
      <p>Total USDC: {totalUsdcBalance.toFixed(2)}</p>
      <p>Perp Account: {perpBalance.toFixed(2)}</p>
      <p>Spot USDC: {spotBalances.USDC?.toFixed(2) || '0.00'}</p>
    </div>
  );
}`,
  chainIds: `import { CHAIN_IDS } from 'relay-bridge-sdk';

// Available chain IDs
console.log(CHAIN_IDS.ETHEREUM);    // 1
console.log(CHAIN_IDS.ARBITRUM);    // 42161
console.log(CHAIN_IDS.OPTIMISM);     // 10
console.log(CHAIN_IDS.BASE);         // 8453
console.log(CHAIN_IDS.POLYGON);      // 137
console.log(CHAIN_IDS.BSC);          // 56
console.log(CHAIN_IDS.HYPEREVM);     // 999`,
};

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-40 pb-12 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-black uppercase mb-4 bg-linear-to-r from-[#03b3c3] to-[#d856bf] bg-clip-text text-transparent">
            SDK Documentation
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Complete guide to integrating Relay Bridge SDK into your application
          </p>
          <div className="mt-4 flex gap-4 justify-center items-center">
            <a
              href="https://www.npmjs.com/package/relay-bridge-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#03b3c3] hover:text-[#03b3c3]/80 text-sm"
            >
              View on npm →
            </a>
            <span className="text-white/30">•</span>
            <a
              href="https://github.com/KaushikKC/relay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#03b3c3] hover:text-[#03b3c3]/80 text-sm"
            >
              View on GitHub →
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto">
          {["overview", "installation", "components", "hooks", "examples"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition-all duration-300 border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? "border-[#03b3c3] text-[#03b3c3]"
                    : "border-transparent text-white/50 hover:text-white"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="glass-card p-8">
              <h2 className="text-3xl font-heading font-black uppercase mb-4">
                What is Relay Bridge SDK?
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                Relay Bridge SDK is a TypeScript library that enables seamless
                cross-chain bridging to HyperEVM and automatic deposits to
                Hyperliquid trading accounts. Built on top of LI.FI, it provides
                a simple API for complex multi-chain operations.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#03b3c3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#03b3c3] font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      One-Click Bridging
                    </h3>
                    <p className="text-white/70">
                      Bridge assets from any supported chain to HyperEVM with
                      optimal routes automatically discovered via LI.FI.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#03b3c3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#03b3c3] font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Auto-Deposit to Hyperliquid
                    </h3>
                    <p className="text-white/70">
                      Automatically bridge to Arbitrum and deposit USDC directly
                      to your Hyperliquid trading account in a single flow.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#03b3c3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#03b3c3] font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Real-time Progress Tracking
                    </h3>
                    <p className="text-white/70">
                      Monitor bridge progress with detailed step-by-step status
                      updates, transaction hashes, and error recovery.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#03b3c3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#03b3c3] font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Type-Safe & Mobile-First
                    </h3>
                    <p className="text-white/70">
                      Full TypeScript support with comprehensive types,
                      optimized for mobile wallets and touch interactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-8">
              <h2 className="text-3xl font-heading font-black uppercase mb-4">
                Package Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">Package Name</p>
                  <p className="text-white font-mono">relay-bridge-sdk</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Current Version</p>
                  <p className="text-white font-mono">1.0.1</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">License</p>
                  <p className="text-white">MIT</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Repository</p>
                  <a
                    href="https://github.com/KaushikKC/relay"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#03b3c3] hover:underline"
                  >
                    github.com/KaushikKC/relay
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Installation Tab */}
        {activeTab === "installation" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="glass-card p-8">
              <h2 className="text-3xl font-heading font-black uppercase mb-6">
                Installation
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    1. Install the Package
                  </h3>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                      <code className="text-sm text-white/90">
                        {codeExamples.install}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(codeExamples.install, "install")
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "install" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    2. Setup Web3 Provider
                  </h3>
                  <p className="text-white/70 mb-3">
                    Wrap your app with WagmiProvider and QueryClientProvider
                    using the pre-configured config from the SDK.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                      <code className="text-sm text-white/90">
                        {codeExamples.setup}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(codeExamples.setup, "setup")
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "setup" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    3. Peer Dependencies
                  </h3>
                  <p className="text-white/70 mb-3">
                    The SDK requires these peer dependencies (already included
                    in installation):
                  </p>
                  <ul className="list-disc list-inside text-white/70 space-y-1 mb-3">
                    <li>
                      <code className="text-[#03b3c3]">react</code> ^18.0.0 ||
                      ^19.0.0
                    </li>
                    <li>
                      <code className="text-[#03b3c3]">react-dom</code> ^18.0.0
                      || ^19.0.0
                    </li>
                    <li>
                      <code className="text-[#03b3c3]">wagmi</code> ^2.0.0
                    </li>
                    <li>
                      <code className="text-[#03b3c3]">viem</code> ^2.0.0
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Components Tab */}
        {activeTab === "components" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="glass-card p-8">
              <h2 className="text-3xl font-heading font-black uppercase mb-6">
                Components
              </h2>

              <div className="space-y-6">
                <div className="p-6 glass-card rounded-lg border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-[#03b3c3]">
                    BridgeWidget
                  </h3>
                  <p className="text-white/70 mb-4">
                    A complete bridge UI component with built-in wallet
                    connection, chain selection, token selection, and bridge
                    execution.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                      <code className="text-sm text-white/90">
                        {codeExamples.bridgeWidget}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          codeExamples.bridgeWidget,
                          "bridgeWidget"
                        )
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "bridgeWidget" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="p-6 glass-card rounded-lg border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-[#d856bf]">
                    DepositToHyperliquid
                  </h3>
                  <p className="text-white/70 mb-4">
                    Component for depositing USDC from Arbitrum to Hyperliquid
                    trading account. Handles approval, balance checks, and
                    deposit execution.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                      <code className="text-sm text-white/90">
                        {`import { DepositToHyperliquid } from 'relay-bridge-sdk/components';

function DepositPage() {
  return (
    <DepositToHyperliquid
      amount="100"
      onSuccess={(txHash) => {
        console.log('Deposit complete:', txHash);
      }}
      onCancel={() => {
        console.log('Deposit cancelled');
      }}
    />
  );
}`}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { DepositToHyperliquid } from 'relay-bridge-sdk/components';`,
                          "deposit"
                        )
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "deposit" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hooks Tab */}
        {activeTab === "hooks" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="glass-card p-8">
              <h2 className="text-3xl font-heading font-black uppercase mb-6">
                Hooks
              </h2>

              <div className="space-y-6">
                <div className="p-6 glass-card rounded-lg border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-[#03b3c3]">
                    useLiFiBridge
                  </h3>
                  <p className="text-white/70 mb-4">
                    Hook for fetching routes and executing bridges to HyperEVM.
                    Provides real-time status updates and step-by-step progress
                    tracking.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20 max-h-96">
                      <code className="text-sm text-white/90">
                        {codeExamples.customBridge}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          codeExamples.customBridge,
                          "customBridge"
                        )
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "customBridge" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="p-6 glass-card rounded-lg border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-[#d856bf]">
                    useHyperliquidDeposit
                  </h3>
                  <p className="text-white/70 mb-4">
                    Hook for the complete flow: bridge to Arbitrum, check
                    balance, approve USDC, and deposit to Hyperliquid. Handles
                    gas bundling automatically.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20 max-h-96">
                      <code className="text-sm text-white/90">
                        {codeExamples.hyperliquidDeposit}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          codeExamples.hyperliquidDeposit,
                          "hyperliquidDeposit"
                        )
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "hyperliquidDeposit" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="p-6 glass-card rounded-lg border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-[#03b3c3]">
                    useHyperliquidBalance
                  </h3>
                  <p className="text-white/70 mb-4">
                    Hook for fetching Hyperliquid account balances including
                    perp account, spot balances, and total USDC.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                      <code className="text-sm text-white/90">
                        {codeExamples.balanceCheck}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          codeExamples.balanceCheck,
                          "balanceCheck"
                        )
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "balanceCheck" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === "examples" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="glass-card p-8">
              <h2 className="text-3xl font-heading font-black uppercase mb-6">
                Code Examples
              </h2>

              <div className="space-y-6">
                <div className="p-6 glass-card rounded-lg border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-[#03b3c3]">
                    Using Chain IDs
                  </h3>
                  <p className="text-white/70 mb-4">
                    Import and use predefined chain IDs for type-safe chain
                    selection.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                      <code className="text-sm text-white/90">
                        {codeExamples.chainIds}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(codeExamples.chainIds, "chainIds")
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "chainIds" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="p-6 glass-card rounded-lg border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-[#d856bf]">
                    Complete Integration Example
                  </h3>
                  <p className="text-white/70 mb-4">
                    Full example showing bridge to HyperEVM with error handling
                    and success callbacks.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20 max-h-96">
                      <code className="text-sm text-white/90">
                        {codeExamples.customBridge}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          codeExamples.customBridge,
                          "completeExample"
                        )
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "completeExample" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 glass-card p-8 text-center border border-[#03b3c3]/30">
          <h2 className="text-3xl font-heading font-black uppercase mb-4">
            Ready to Build?
          </h2>
          <p className="text-white/70 mb-6">
            Start integrating Relay Bridge SDK into your application today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => router.push("/app")}>Try Live Demo</Button>
            <Button
              onClick={() => router.push("/dev")}
              className="bg-white/5 border border-white/20 hover:bg-white/10"
            >
              Developer Playground
            </Button>
            <Button
              onClick={() =>
                window.open(
                  "https://www.npmjs.com/package/relay-bridge-sdk",
                  "_blank"
                )
              }
              className="bg-white/5 border border-white/20 hover:bg-white/10"
            >
              View on npm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

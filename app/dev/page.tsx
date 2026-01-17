"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import BridgeWidget from "@/components/BridgeWidget";
import DepositToHyperliquid from "@/components/DepositToHyperliquid";

const COMPONENT_EXAMPLES = {
  bridgeWidget: {
    title: "Bridge Widget",
    description:
      "Full-featured bridge component with built-in UI and wallet integration",
    code: `import { BridgeWidget } from '@relay-bridge/sdk/components';

function App() {
  return (
    <BridgeWidget
      onSuccess={(txHash) => {
        console.log('Bridge complete:', txHash);
      }}
      onError={(error) => {
        console.error('Bridge failed:', error);
      }}
    />
  );
}`,
    component: "BridgeWidget",
  },
  depositToHyperliquid: {
    title: "Deposit to Hyperliquid",
    description:
      "Component for depositing funds to Hyperliquid trading account",
    code: `import { DepositToHyperliquid } from '@relay-bridge/sdk/components';

function App() {
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
}`,
    component: "DepositToHyperliquid",
  },
  useLiFiBridge: {
    title: "useLiFiBridge Hook",
    description: "React hook for building custom bridge UIs",
    code: `import { useLiFiBridge } from '@relay-bridge/sdk/hooks';
import { CHAIN_IDS } from '@relay-bridge/sdk';

function CustomBridge() {
  const { fetchRoute, executeBridge, bridgeState } = useLiFiBridge();
  const [amount, setAmount] = useState('100');

  const handleBridge = async () => {
    const route = await fetchRoute({
      fromChain: CHAIN_IDS.BASE,
      toChain: CHAIN_IDS.HYPEREVM,
      fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      toToken: '0x0000000000000000000000000000000000000000',
      amount,
    });
    
    await executeBridge(route);
  };

  return (
    <div>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <button onClick={handleBridge}>Bridge</button>
      
      {bridgeState.status === 'executing' && (
        <div>Bridging... {bridgeState.currentStepIndex + 1}/{bridgeState.steps.length}</div>
      )}
    </div>
  );
}`,
    component: "Hook",
  },
  useHyperliquidBalance: {
    title: "useHyperliquidBalance Hook",
    description: "Fetch Hyperliquid account balance",
    code: `import { useHyperliquidBalance } from '@relay-bridge/sdk/hooks';
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
}`,
    component: "Hook",
  },
};

const CODE_GENERATORS = {
  basicBridge: {
    title: "Basic Bridge Setup",
    inputs: [
      {
        name: "fromChain",
        label: "From Chain",
        type: "select",
        options: ["Ethereum", "Base", "Arbitrum", "Optimism"],
      },
      {
        name: "toChain",
        label: "To Chain",
        type: "select",
        options: ["HyperEVM", "Arbitrum"],
      },
      { name: "amount", label: "Amount", type: "text", placeholder: "100" },
    ],
    generate: (
      values: Record<string, string>
    ) => `import { useLiFiBridge } from '@relay-bridge/sdk/hooks';
import { CHAIN_IDS } from '@relay-bridge/sdk';

function Bridge() {
  const { fetchRoute, executeBridge } = useLiFiBridge();

  const handleBridge = async () => {
    const route = await fetchRoute({
      fromChain: CHAIN_IDS.${values.fromChain?.toUpperCase() || "BASE"},
      toChain: CHAIN_IDS.${values.toChain?.toUpperCase() || "HYPEREVM"},
      fromToken: '0x...', // Your token address
      amount: '${values.amount || "100"}',
    });
    
    await executeBridge(route);
  };

  return <button onClick={handleBridge}>Bridge</button>;
}`,
  },
  fullIntegration: {
    title: "Full Integration with Auto-Deposit",
    inputs: [
      {
        name: "depositEnabled",
        label: "Enable Auto-Deposit",
        type: "checkbox",
      },
    ],
    generate: (
      values: Record<string, string>
    ) => `import { useLiFiBridge, useHyperliquidDeposit } from '@relay-bridge/sdk/hooks';
import { CHAIN_IDS } from '@relay-bridge/sdk';

function FullIntegration() {
  const { fetchRoute, executeBridge, bridgeState } = useLiFiBridge();
  const { fetchHyperliquidRoute, executeDeposit, hyperliquidState } = useHyperliquidDeposit();

  const handleBridgeAndDeposit = async () => {
    ${
      values.depositEnabled === "true"
        ? `// Bridge to Arbitrum and auto-deposit
    const route = await fetchHyperliquidRoute({
      fromChain: CHAIN_IDS.BASE,
      fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      amount: '100',
    });
    
    await executeDeposit(route);`
        : `// Bridge to HyperEVM only
    const route = await fetchRoute({
      fromChain: CHAIN_IDS.BASE,
      toChain: CHAIN_IDS.HYPEREVM,
      fromToken: '0x...', 
      amount: '100',
    });
    
    await executeBridge(route);`
    }
  };

  return (
    <div>
      <button onClick={handleBridgeAndDeposit}>
        ${
          values.depositEnabled === "true"
            ? "Bridge & Deposit"
            : "Bridge to HyperEVM"
        }
      </button>
      
      {${
        values.depositEnabled === "true" ? "hyperliquidState" : "bridgeState"
      }.status === 'executing' && (
        <div>Processing...</div>
      )}
    </div>
  );
}`,
  },
};

export default function DevPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "playground" | "generator" | "snippets"
  >("playground");
  const [selectedComponent, setSelectedComponent] =
    useState<keyof typeof COMPONENT_EXAMPLES>("bridgeWidget");
  const [selectedGenerator, setSelectedGenerator] =
    useState<keyof typeof CODE_GENERATORS>("basicBridge");
  const [generatorValues, setGeneratorValues] = useState<
    Record<string, string>
  >({});
  const [showPreview, setShowPreview] = useState(true);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateCode = () => {
    const generator = CODE_GENERATORS[selectedGenerator];
    return generator.generate(generatorValues);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-40 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-black uppercase mb-4 bg-gradient-to-r from-[#03b3c3] to-[#d856bf] bg-clip-text text-transparent">
            Developer Playground
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Interactive components, code generators, and integration snippets
            for the Relay Bridge SDK
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto">
          {(["playground", "generator", "snippets"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-all duration-300 border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "border-[#03b3c3] text-[#03b3c3]"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              {tab === "playground"
                ? "🎮 Component Playground"
                : tab === "generator"
                ? "⚙️ Code Generator"
                : "📋 Snippets"}
            </button>
          ))}
        </div>

        {/* Playground Tab */}
        {activeTab === "playground" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Component List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-bold mb-4">
                Components & Hooks
              </h2>
              {Object.entries(COMPONENT_EXAMPLES).map(([key, example]) => (
                <button
                  key={key}
                  onClick={() =>
                    setSelectedComponent(key as keyof typeof COMPONENT_EXAMPLES)
                  }
                  className={`w-full glass-card p-6 rounded-lg text-left transition-all ${
                    selectedComponent === key
                      ? "border-2 border-[#03b3c3] bg-[#03b3c3]/5"
                      : "border border-white/10 hover:border-white/30"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">{example.title}</h3>
                  <p className="text-white/60 text-sm">{example.description}</p>
                </button>
              ))}
            </div>

            {/* Code & Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-heading font-bold">
                  {COMPONENT_EXAMPLES[selectedComponent].title}
                </h2>
                {COMPONENT_EXAMPLES[selectedComponent].component !== "Hook" && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                  >
                    {showPreview ? "Hide" : "Show"} Preview
                  </button>
                )}
              </div>

              {/* Code */}
              <div className="relative">
                <pre className="glass-card p-6 rounded-lg overflow-x-auto max-h-96 overflow-y-auto border border-white/10">
                  <code className="text-sm text-white/90">
                    {COMPONENT_EXAMPLES[selectedComponent].code}
                  </code>
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(
                      COMPONENT_EXAMPLES[selectedComponent].code,
                      selectedComponent
                    )
                  }
                  className="absolute top-4 right-4 px-4 py-2 rounded bg-[#03b3c3]/20 border border-[#03b3c3] text-[#03b3c3] hover:bg-[#03b3c3]/30 transition-colors text-sm font-semibold"
                >
                  {copied === selectedComponent ? "✓ Copied!" : "Copy Code"}
                </button>
              </div>

              {/* Live Preview */}
              {showPreview &&
                COMPONENT_EXAMPLES[selectedComponent].component !== "Hook" && (
                  <div className="glass-card p-6 rounded-lg border border-[#03b3c3]/30">
                    <h3 className="text-lg font-bold mb-4 text-[#03b3c3]">
                      Live Preview
                    </h3>
                    <div className="bg-black/20 p-4 rounded-lg">
                      {selectedComponent === "bridgeWidget" && (
                        <div className="scale-90 origin-top-left">
                          <BridgeWidget />
                        </div>
                      )}
                      {selectedComponent === "depositToHyperliquid" && (
                        <div className="text-center text-white/50 py-12">
                          Connect wallet and complete bridge to preview
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Code Generator Tab */}
        {activeTab === "generator" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generator Selection */}
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold mb-4">
                Code Templates
              </h2>

              {Object.entries(CODE_GENERATORS).map(([key, generator]) => (
                <button
                  key={key}
                  onClick={() =>
                    setSelectedGenerator(key as keyof typeof CODE_GENERATORS)
                  }
                  className={`w-full glass-card p-6 rounded-lg text-left transition-all ${
                    selectedGenerator === key
                      ? "border-2 border-[#d856bf] bg-[#d856bf]/5"
                      : "border border-white/10 hover:border-white/30"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">{generator.title}</h3>
                </button>
              ))}

              {/* Generator Inputs */}
              <div className="glass-card p-6 rounded-lg border border-white/10">
                <h3 className="text-lg font-bold mb-4">Configuration</h3>
                <div className="space-y-4">
                  {CODE_GENERATORS[selectedGenerator].inputs.map((input) => (
                    <div key={input.name}>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        {input.label}
                      </label>
                      {input.type === "select" ? (
                        <select
                          value={generatorValues[input.name] || ""}
                          onChange={(e) =>
                            setGeneratorValues({
                              ...generatorValues,
                              [input.name]: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#03b3c3] focus:outline-none"
                        >
                          <option value="">Select...</option>
                          {"options" in input &&
                            input.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                        </select>
                      ) : input.type === "checkbox" ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={generatorValues[input.name] === "true"}
                            onChange={(e) =>
                              setGeneratorValues({
                                ...generatorValues,
                                [input.name]: e.target.checked.toString(),
                              })
                            }
                            className="w-5 h-5 rounded bg-white/5 border border-white/10 checked:bg-[#03b3c3] checked:border-[#03b3c3]"
                          />
                          <span className="text-white/70">Enable</span>
                        </label>
                      ) : (
                        <input
                          type={input.type}
                          value={generatorValues[input.name] || ""}
                          onChange={(e) =>
                            setGeneratorValues({
                              ...generatorValues,
                              [input.name]: e.target.value,
                            })
                          }
                          placeholder={
                            "placeholder" in input ? input.placeholder : ""
                          }
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#03b3c3] focus:outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Code */}
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-bold mb-4">
                Generated Code
              </h2>
              <div className="relative">
                <pre className="glass-card p-6 rounded-lg overflow-x-auto max-h-[600px] overflow-y-auto border border-white/10">
                  <code className="text-sm text-white/90">
                    {generateCode()}
                  </code>
                </pre>
                <button
                  onClick={() => copyToClipboard(generateCode(), "generated")}
                  className="absolute top-4 right-4 px-4 py-2 rounded bg-[#d856bf]/20 border border-[#d856bf] text-[#d856bf] hover:bg-[#d856bf]/30 transition-colors text-sm font-semibold"
                >
                  {copied === "generated" ? "✓ Copied!" : "Copy Code"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Snippets Tab */}
        {activeTab === "snippets" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-heading font-bold mb-6">
              Common Snippets
            </h2>

            {/* Installation */}
            <div className="glass-card p-6 rounded-lg border border-white/10">
              <h3 className="text-xl font-bold mb-4 text-[#03b3c3]">
                Installation
              </h3>
              <div className="relative">
                <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                  <code className="text-sm text-white/90">
                    {`# npm
npm install @relay-bridge/sdk wagmi viem

# yarn
yarn add @relay-bridge/sdk wagmi viem

# pnpm
pnpm add @relay-bridge/sdk wagmi viem`}
                  </code>
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(
                      "npm install @relay-bridge/sdk wagmi viem",
                      "install"
                    )
                  }
                  className="absolute top-2 right-2 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                >
                  {copied === "install" ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Setup */}
            <div className="glass-card p-6 rounded-lg border border-white/10">
              <h3 className="text-xl font-bold mb-4 text-[#03b3c3]">
                Provider Setup
              </h3>
              <div className="relative">
                <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                  <code className="text-sm text-white/90">
                    {`import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@relay-bridge/sdk';

const queryClient = new QueryClient();

export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}`}
                  </code>
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `import { WagmiProvider } from 'wagmi';\n...`,
                      "setup"
                    )
                  }
                  className="absolute top-2 right-2 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                >
                  {copied === "setup" ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Import Examples */}
            <div className="glass-card p-6 rounded-lg border border-white/10">
              <h3 className="text-xl font-bold mb-4 text-[#03b3c3]">
                Import Examples
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <pre className="glass-card p-3 rounded-lg overflow-x-auto bg-black/20">
                    <code className="text-sm text-white/90">
                      {`// Components
import { BridgeWidget, DepositToHyperliquid } from '@relay-bridge/sdk/components';`}
                    </code>
                  </pre>
                </div>
                <div className="relative">
                  <pre className="glass-card p-3 rounded-lg overflow-x-auto bg-black/20">
                    <code className="text-sm text-white/90">
                      {`// Hooks
import { useLiFiBridge, useHyperliquidDeposit, useHyperliquidBalance } from '@relay-bridge/sdk/hooks';`}
                    </code>
                  </pre>
                </div>
                <div className="relative">
                  <pre className="glass-card p-3 rounded-lg overflow-x-auto bg-black/20">
                    <code className="text-sm text-white/90">
                      {`// Utils
import { formatTokenAmount, getFeaturedTokens } from '@relay-bridge/sdk/utils';`}
                    </code>
                  </pre>
                </div>
                <div className="relative">
                  <pre className="glass-card p-3 rounded-lg overflow-x-auto bg-black/20">
                    <code className="text-sm text-white/90">
                      {`// Config
import { CHAIN_IDS, config } from '@relay-bridge/sdk';`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 glass-card p-8 text-center border border-[#03b3c3]/30">
          <h2 className="text-3xl font-heading font-black uppercase mb-4">
            Ready to Ship?
          </h2>
          <p className="text-white/70 mb-6">
            Get the full documentation and start building production-ready
            integrations.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => window.open("/docs", "_blank")}>
              Full Documentation
            </Button>
            <Button
              onClick={() =>
                window.open("https://github.com/relay-bridge/sdk", "_blank")
              }
              className="bg-white/5 border border-white/20 hover:bg-white/10"
            >
              View on GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

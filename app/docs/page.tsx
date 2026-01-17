"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

const codeExamples = {
  install: `npm install @lifi/sdk`,
  basic: `import { LiFi } from '@lifi/sdk';

const lifi = new LiFi({
  integrator: 'your-app-name',
});

const routes = await lifi.getRoutes({
  fromChain: 1, // Ethereum
  toChain: 8453, // Base
  fromToken: '0x...', // USDC
  toToken: '0x...', // USDC
  fromAmount: '1000000000', // 1000 USDC
});`,
  execute: `const route = routes.routes[0];

const execution = await lifi.executeRoute({
  route,
  signer: walletSigner,
});

// Monitor progress
execution.on('statusUpdate', (status) => {
  console.log('Status:', status);
});`,
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
          <h1 className="text-5xl md:text-7xl font-heading font-black uppercase mb-4">
            Developer Docs
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Build with confidence. Integrate Relay in minutes.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          {["overview", "integration", "examples"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-all duration-300 border-b-2 ${
                activeTab === tab
                  ? "border-[#03b3c3] text-[#03b3c3]"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="glass-card p-8">
              <h2 className="text-3xl font-heading font-black uppercase mb-4">
                SDK Overview
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                Relay uses the LI.FI SDK to provide seamless cross-chain
                bridging. The SDK handles route discovery, execution, and
                monitoring automatically.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#03b3c3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#03b3c3] font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Route Discovery
                    </h3>
                    <p className="text-white/70">
                      Automatically finds the best route across chains with
                      optimal fees and speed.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#03b3c3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#03b3c3] font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      One-Click Execution
                    </h3>
                    <p className="text-white/70">
                      Execute bridges with a single transaction. No manual steps
                      required.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#03b3c3]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[#03b3c3] font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Real-time Monitoring
                    </h3>
                    <p className="text-white/70">
                      Track bridge progress with live status updates and
                      transaction hashes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integration Tab */}
        {activeTab === "integration" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="glass-card p-8">
              <h2 className="text-3xl font-heading font-black uppercase mb-6">
                Integration Steps
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    1. Install the SDK
                  </h3>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto">
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
                  <h3 className="text-xl font-semibold mb-3">2. Initialize</h3>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm text-white/90">
                        {codeExamples.basic}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(codeExamples.basic, "basic")
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "basic" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    3. Execute Routes
                  </h3>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm text-white/90">
                        {codeExamples.execute}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(codeExamples.execute, "execute")
                      }
                      className="absolute top-4 right-4 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      {copied === "execute" ? "Copied!" : "Copy"}
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
                Example Usage
              </h2>

              <div className="space-y-6">
                <div className="p-6 glass-card rounded-lg border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-[#03b3c3]">
                    Bridge ETH to Base
                  </h3>
                  <p className="text-white/70 mb-4">
                    Simple example of bridging Ethereum to Base network.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                      <code className="text-sm text-white/90">
                        {`const route = await lifi.getRoutes({
  fromChain: 1,
  toChain: 8453,
  fromToken: '0x0000000000000000000000000000000000000000',
  toToken: '0x0000000000000000000000000000000000000000',
  fromAmount: '1000000000000000000', // 1 ETH
});`}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="p-6 glass-card rounded-lg border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-[#d856bf]">
                    Monitor Bridge Status
                  </h3>
                  <p className="text-white/70 mb-4">
                    Track your bridge execution in real-time.
                  </p>
                  <div className="relative">
                    <pre className="glass-card p-4 rounded-lg overflow-x-auto bg-black/20">
                      <code className="text-sm text-white/90">
                        {`execution.on('statusUpdate', (status) => {
  switch (status) {
    case 'PENDING':
      console.log('Waiting for confirmation...');
      break;
    case 'DONE':
      console.log('Bridge complete!');
      break;
  }
});`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 glass-card p-8 text-center">
          <h2 className="text-3xl font-heading font-black uppercase mb-4">
            Ready to Build?
          </h2>
          <p className="text-white/70 mb-6">
            Start integrating Relay into your application today.
          </p>
          <Button onClick={() => router.push("/app")}>Try It Now</Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useConnect, useAccount } from "wagmi";
import Button from "./Button";

interface MobileWalletConnectProps {
  onConnected?: () => void;
}

export default function MobileWalletConnect({
  onConnected,
}: MobileWalletConnectProps) {
  const { connect, connectors, error, isPending } = useConnect();
  const { isConnected } = useAccount();
  const [showConnectors, setShowConnectors] = useState(false);

  // Filter and prioritize mobile-friendly connectors
  const mobileConnectors = connectors
    .filter((c) => {
      const name = c.name?.toLowerCase() || "";
      return (
        !name.includes("neoline") &&
        !name.includes("unknown") &&
        (name.includes("walletconnect") ||
          name.includes("metamask") ||
          name.includes("coinbase") ||
          name.includes("injected"))
      );
    })
    .sort((a, b) => {
      // Prioritize WalletConnect for mobile
      const aName = a.name?.toLowerCase() || "";
      const bName = b.name?.toLowerCase() || "";
      if (aName.includes("walletconnect")) return -1;
      if (bName.includes("walletconnect")) return 1;
      if (aName.includes("metamask")) return -1;
      if (bName.includes("metamask")) return 1;
      return 0;
    });

  const handleConnect = async (connector: (typeof connectors)[0]) => {
    try {
      await connect({ connector });
      setShowConnectors(false);
      if (onConnected) {
        onConnected();
      }
    } catch (err) {
      console.error("Connection error:", err);
    }
  };

  if (isConnected) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <Button
        onClick={() => setShowConnectors(!showConnectors)}
        disabled={isPending}
        className="w-full text-base md:text-lg py-5 md:py-4 min-h-[56px] touch-manipulation"
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </Button>

      {showConnectors && (
        <div className="space-y-3 animate-fade-in">
          {mobileConnectors.length === 0 ? (
            <div className="glass-card p-4 text-center text-white/70 text-sm">
              <p>No mobile wallets detected.</p>
              <p className="mt-2 text-xs">
                Please install a wallet app like MetaMask or use WalletConnect.
              </p>
            </div>
          ) : (
            mobileConnectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={isPending}
                className="w-full glass-card p-4 rounded-lg border border-white/10 hover:border-[#03b3c3]/50 transition-all text-left touch-manipulation active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-base">
                      {connector.name || "Injected Wallet"}
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      {connector.name?.toLowerCase().includes("walletconnect")
                        ? "Scan QR code to connect"
                        : "Tap to connect"}
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-white/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <div className="glass-card p-4 rounded-lg border border-red-500/50 bg-red-500/10">
          <p className="text-red-400 text-sm">
            {error.message || "Failed to connect wallet"}
          </p>
          <p className="text-white/50 text-xs mt-2">
            Make sure your wallet app is installed and unlocked.
          </p>
        </div>
      )}
    </div>
  );
}

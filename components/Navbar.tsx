"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./Button";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnectWallet = async () => {
    // Filter out problematic connectors (NeoLine, etc.) and prefer MetaMask
    const availableConnectors = connectors.filter((c) => {
      const name = c.name?.toLowerCase() || "";
      return !name.includes("neoline") && !name.includes("unknown");
    });

    // Prefer MetaMask if available
    const metaMaskConnector = availableConnectors.find((c) =>
      c.name?.toLowerCase().includes("metamask")
    );
    const connector = metaMaskConnector || availableConnectors[0];

    if (connector) {
      try {
        await connect({ connector });
      } catch (err) {
        console.error("Connection error:", err);
      }
    } else {
      console.warn("No available connectors found");
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navItems = [
    { href: "/app", label: "App" },
    { href: "/about", label: "About" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <nav className="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-3 md:px-8">
      <div className="relative group">
        {/* Glassmorphism Container - Mobile Optimized */}
        <div className="rounded-full bg-black/20 backdrop-blur-xl border border-white/10 px-3 md:px-6 py-2.5 md:py-3 flex items-center justify-between gap-2 md:gap-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(3,179,195,0.3)]">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center transition-opacity touch-manipulation"
          >
            <div className="relative w-8 h-8 md:w-16 md:h-16">
              <Image
                src="/logo.png"
                alt="Relay Logo"
                fill
                className=""
                priority
              />
            </div>
            <span className="text-white font-heading text-base md:text-xl font-black uppercase hidden md:block">
              Relay
            </span>
          </Link>

          {/* Navigation Items - Hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-full text-base font-medium transition-all duration-300 touch-manipulation ${
                    isActive
                      ? "text-white bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-linear-to-r from-[#03b3c3]/20 to-[#d856bf]/20 blur-xl -z-10" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Connect Wallet Button - Mobile Optimized */}
          <div className="relative">
            <Button
              onClick={isConnected ? handleDisconnect : handleConnectWallet}
              className="text-xs md:text-base whitespace-nowrap px-3 md:px-8 py-2 md:py-4 min-h-[36px] md:min-h-[44px] touch-manipulation"
              disabled={isPending}
            >
              {isPending ? (
                <span className="text-xs md:text-base">Connecting...</span>
              ) : isConnected && address ? (
                <>
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-400 animate-pulse inline-block mr-1 md:mr-2" />
                  <span className="text-xs md:text-base">
                    {formatAddress(address)}
                  </span>
                </>
              ) : (
                <span className="text-xs md:text-base">Connect</span>
              )}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="absolute top-full right-0 mt-2 glass-card rounded-lg p-3 min-w-[250px] z-50 border border-red-500/50">
                <p className="text-red-400 text-xs">
                  {error.message ||
                    "Failed to connect wallet. Please try again."}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Tip: Make sure your wallet extension is unlocked.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cyberpunk Glow Effect on Hover */}
        <div className="absolute inset-0 rounded-full bg-linear-to-r from-[#03b3c3]/0 via-[#d856bf]/0 to-[#03b3c3]/0 group-hover:from-[#03b3c3]/10 group-hover:via-[#d856bf]/10 group-hover:to-[#03b3c3]/10 blur-2xl -z-10 transition-all duration-500" />
      </div>
    </nav>
  );
}

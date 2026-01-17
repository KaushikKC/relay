"use client";

import Navbar from "@/components/Navbar";
import BridgeWidget from "@/components/BridgeWidget";

export default function AppPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-24 md:pt-40 pb-8 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
        <BridgeWidget />
      </div>
    </div>
  );
}

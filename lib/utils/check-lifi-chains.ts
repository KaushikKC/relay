import { getChains } from "@lifi/sdk";

/**
 * Debug utility to check all supported chains by LI.FI
 * This helps us verify if HyperEVM is supported and what its chain ID is
 */
export async function checkLiFiChains() {
  try {
    console.log("🔍 Fetching all supported chains from LI.FI...");
    const chains = await getChains();

    console.log(`\n✓ Found ${chains.length} supported chains:\n`);

    // Look for HyperEVM or similar names (chain ID 999)
    const hyperevmChains = chains.filter(
      (chain) =>
        chain.name.toLowerCase().includes("hyper") ||
        chain.name.toLowerCase().includes("hyperliquid") ||
        chain.id === 999
    );

    if (hyperevmChains.length > 0) {
      console.log("🎯 Found HyperEVM-related chains:");
      hyperevmChains.forEach((chain) => {
        console.log(
          `  - ID: ${chain.id}, Name: ${chain.name}, Key: ${chain.key}`
        );
      });
    } else {
      console.warn("⚠️  HyperEVM not found in LI.FI supported chains!");
      console.log("\n📋 Here are some popular supported chains:");

      // Show first 20 chains
      chains.slice(0, 20).forEach((chain) => {
        console.log(`  - ID: ${chain.id}, Name: ${chain.name}`);
      });

      console.log(`\n... and ${chains.length - 20} more chains`);
    }

    // Check specific chain IDs
    console.log("\n🔎 Checking HyperEVM chain ID:");
    const hyperevmChain = chains.find((c) => c.id === 999);
    if (hyperevmChain) {
      console.log(
        `  ✓ Chain ID 999: ${hyperevmChain.name} (${hyperevmChain.key})`
      );
      console.log(`  ✅ HyperEVM is SUPPORTED by LI.FI!`);
    } else {
      console.log(`  ✗ Chain ID 999: Not supported by LI.FI`);
      console.log(`  ⚠️  HyperEVM is NOT yet supported by LI.FI`);
      console.log(
        `  💡 You may need to use a two-step bridge or custom integration`
      );
    }

    return chains;
  } catch (error) {
    console.error("❌ Error fetching chains:", error);
    return [];
  }
}

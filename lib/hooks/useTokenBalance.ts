import { useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

export function useTokenBalance(chainId: number, tokenAddress?: string) {
  const { address } = useAccount();

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: address,
    chainId: chainId,
    token:
      tokenAddress === "0x0000000000000000000000000000000000000000"
        ? undefined
        : (tokenAddress as `0x${string}`),
  });

  // Compute balance directly instead of using setState in effect
  const balance = useMemo(() => {
    if (balanceData) {
      return formatUnits(balanceData.value, balanceData.decimals);
    }
    return "0";
  }, [balanceData]);

  return { balance, isLoading: isBalanceLoading, symbol: balanceData?.symbol };
}

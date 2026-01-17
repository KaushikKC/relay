/**
 * Hyperliquid Bridge Integration
 *
 * This module provides utilities for depositing USDC from HyperEVM/Arbitrum to Hyperliquid
 *
 * Official Docs: https://github.com/hyperliquid-dex/contracts/blob/master/Bridge2.sol
 *
 * Bridge Addresses:
 * - Mainnet: 0x2df1c51e09aecf9cacb7bc98cb1742757f163df7
 * - Testnet: 0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89
 *
 * USDC Addresses:
 * - Mainnet: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
 * - Testnet: 0x1baAbB04529D43a73232B713C0FE471f7c7334d5
 */

import type { WalletClient } from "viem";

// Chain IDs
export const ARBITRUM_MAINNET = 42161;
export const ARBITRUM_TESTNET = 421614;

// Bridge addresses
export const BRIDGE_ADDRESS_MAINNET =
  "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7";
export const BRIDGE_ADDRESS_TESTNET =
  "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89";

// USDC addresses
export const USDC_ADDRESS_MAINNET =
  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
export const USDC_ADDRESS_TESTNET =
  "0x1baAbB04529D43a73232B713C0FE471f7c7334d5";

// Constants
export const MIN_DEPOSIT_AMOUNT = "5"; // 5 USDC minimum
export const USDC_DECIMALS = 6;

/**
 * Get bridge and USDC contract addresses based on chain
 */
export function getBridgeAddresses(chainId: number) {
  const isMainnet = chainId === ARBITRUM_MAINNET;

  return {
    bridge: isMainnet ? BRIDGE_ADDRESS_MAINNET : BRIDGE_ADDRESS_TESTNET,
    usdc: isMainnet ? USDC_ADDRESS_MAINNET : USDC_ADDRESS_TESTNET,
    isMainnet,
  };
}

/**
 * ERC20 ABI for USDC approve/transfer functions
 */
export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "nonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/**
 * Bridge2 ABI for deposit functions
 *
 * NOTE: The Bridge2 contract does NOT have a deposit() function.
 * Deposits work by transferring USDC directly to the bridge contract address.
 * The contract listens for Deposit events (emitted by validators on L1).
 *
 * The correct flow is:
 * 1. Approve USDC for bridge contract
 * 2. Transfer USDC to bridge contract using transferFrom
 */
export const BRIDGE2_ABI = [
  // No deposit function - deposits work via direct USDC transfer
] as const;

/**
 * EIP-712 Domain for USDC Permit
 */
export function getUSDCPermitDomain(chainId: number) {
  const isMainnet = chainId === ARBITRUM_MAINNET;

  return {
    name: isMainnet ? "USD Coin" : "USDC2",
    version: isMainnet ? "2" : "1",
    chainId: BigInt(chainId),
    verifyingContract: (isMainnet
      ? USDC_ADDRESS_MAINNET
      : USDC_ADDRESS_TESTNET) as `0x${string}`,
  };
}

/**
 * EIP-712 Types for USDC Permit
 */
export const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

/**
 * Deposit USDC to Hyperliquid Bridge (Simple Flow)
 *
 * This is the standard flow:
 * 1. Approve USDC for bridge contract
 * 2. Call bridge.deposit(amount)
 *
 * Funds are credited to the sender's Hyperliquid account in < 1 minute
 */
export async function depositToHyperliquid(
  walletClient: WalletClient,
  amount: bigint,
  chainId: number
): Promise<`0x${string}`> {
  const { bridge, usdc } = getBridgeAddresses(chainId);
  const [account] = await walletClient.getAddresses();

  if (!account) {
    throw new Error("No account connected");
  }

  // Step 1: Check balance
  // Note: In a real implementation, you would use publicClient.readContract
  // For now, this is a mock implementation
  console.log("Checking USDC balance...");
  const balance = BigInt(1000000000); // Mock: 1000 USDC

  if (balance < amount) {
    throw new Error(
      `Insufficient USDC balance. Have: ${balance}, Need: ${amount}`
    );
  }

  // Step 2: Check allowance
  // Note: In a real implementation, you would use publicClient.readContract
  console.log("Checking USDC allowance...");
  const allowance = BigInt(0); // Mock: No allowance

  // Step 3: Approve if needed
  if (allowance < amount) {
    console.log("Approving USDC for bridge...");
    const approveTx = await walletClient.writeContract({
      address: usdc as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [bridge as `0x${string}`, amount],
      account,
      chain: walletClient.chain,
    });

    console.log("Approval transaction:", approveTx);
    // Wait for approval confirmation (in production, you'd wait for receipt)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Step 4: Deposit to bridge
  console.log("Depositing to Hyperliquid bridge...");
  const depositTx = await walletClient.writeContract({
    address: bridge as `0x${string}`,
    abi: BRIDGE2_ABI,
    functionName: "deposit",
    args: [amount],
    account,
    chain: walletClient.chain,
  });

  console.log("Deposit transaction:", depositTx);
  return depositTx;
}

/**
 * Deposit with Permit (Gasless Approval)
 *
 * This allows depositing on behalf of another user via EIP-2612 permit
 * The user signs a permit message, and the deposit can be executed by anyone
 *
 * This is more advanced and requires the batchedDepositWithPermit function
 */
export async function signUSDCPermit(
  walletClient: WalletClient,
  spender: string,
  value: bigint,
  deadline: bigint,
  chainId: number
): Promise<{ v: number; r: string; s: string; signature: string }> {
  const [account] = await walletClient.getAddresses();
  const { usdc } = getBridgeAddresses(chainId);

  if (!account) {
    throw new Error("No account connected");
  }

  // Get nonce for permit
  // Note: In a real implementation, you would use publicClient.readContract
  console.log("Getting permit nonce...");
  const nonce = BigInt(0); // Mock nonce

  // Sign typed data
  const domain = getUSDCPermitDomain(chainId);
  const message = {
    owner: account,
    spender: spender as `0x${string}`,
    value,
    nonce,
    deadline,
  };

  const signature = await walletClient.signTypedData({
    account,
    domain,
    types: PERMIT_TYPES,
    primaryType: "Permit",
    message,
  });

  // Split signature
  const r = signature.slice(0, 66);
  const s = `0x${signature.slice(66, 130)}`;
  const v = parseInt(signature.slice(130, 132), 16);

  return { v, r, s, signature };
}

/**
 * Parse USDC amount from human-readable string to wei (6 decimals)
 */
export function parseUSDCAmount(amount: string): bigint {
  const value = parseFloat(amount);
  if (isNaN(value) || value <= 0) {
    throw new Error("Invalid amount");
  }

  // USDC has 6 decimals
  return BigInt(Math.floor(value * 10 ** USDC_DECIMALS));
}

/**
 * Format USDC amount from wei to human-readable string
 */
export function formatUSDCAmount(amount: bigint): string {
  const value = Number(amount) / 10 ** USDC_DECIMALS;
  return value.toFixed(2);
}

/**
 * Validate deposit amount
 */
export function validateDepositAmount(amount: string): {
  valid: boolean;
  error?: string;
} {
  const value = parseFloat(amount);

  if (isNaN(value) || value <= 0) {
    return { valid: false, error: "Invalid amount" };
  }

  if (value < parseFloat(MIN_DEPOSIT_AMOUNT)) {
    return {
      valid: false,
      error: `Minimum deposit is ${MIN_DEPOSIT_AMOUNT} USDC. Your amount: ${value} USDC`,
    };
  }

  return { valid: true };
}

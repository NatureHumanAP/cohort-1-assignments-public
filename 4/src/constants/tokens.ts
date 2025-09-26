import { CONTRACT_ADDRESSES } from "@/lib/contracts";

type TokenDefinition = {
  id: "token0" | "token1";
  label: string;
  address: `0x${string}`;
  decimals: number;
};

export const TOKENS: readonly TokenDefinition[] = [
  {
    id: "token0",
    label: "Token A (TKA)",
    address: CONTRACT_ADDRESSES.token0 as `0x${string}`,
    decimals: 18,
  },
  {
    id: "token1",
    label: "Token B (TKB)",
    address: CONTRACT_ADDRESSES.token1 as `0x${string}`,
    decimals: 18,
  },
] as const;

export type TokenConfig = (typeof TOKENS)[number];

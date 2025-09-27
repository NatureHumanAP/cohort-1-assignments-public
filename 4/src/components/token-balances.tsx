"use client";

import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { MiniAMM__factory, MockERC20__factory } from "@/typechain";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { formatUnits, zeroAddress } from "viem";
import { useEffect } from "react";
import { TOKENS, type TokenConfig } from "@/constants/tokens";

const formatAmount = (value?: bigint, decimals = 18) => {
  if (value === undefined) return "-";
  const formatted = Number.parseFloat(formatUnits(value, decimals));
  if (Number.isNaN(formatted)) return "-";
  return formatted.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
};

const zeroAddressTyped = zeroAddress as `0x${string}`;
const lpDecimals = 18;

export function TokenBalances({ refreshKey }: { refreshKey: number }) {
  const { address, isConnected } = useAccount();

  const { data: nativeBalance } = useBalance({
    address,
    chainId: 114,
    query: {
      enabled: isConnected,
    },
  });

  const {
    data: userTokenData,
    refetch: refetchUserBalances,
  } = useReadContracts({
    contracts: TOKENS.map((token) => ({
      address: token.address as `0x${string}`,
      abi: MockERC20__factory.abi,
      functionName: "balanceOf",
      args: [address ?? zeroAddressTyped],
    })),
    query: {
      select: (data) => mapResultsToTokens(data, TOKENS),
    },
  });

  const {
    data: poolTokenData,
    refetch: refetchPoolBalances,
  } = useReadContracts({
    contracts: TOKENS.map((token) => ({
      address: token.address as `0x${string}`,
      abi: MockERC20__factory.abi,
      functionName: "balanceOf",
      args: [CONTRACT_ADDRESSES.pair],
    })),
    query: {
      select: (data) => mapResultsToTokens(data, TOKENS),
    },
  });

  const {
    data: lpData,
    refetch: refetchLpData,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.pair,
        abi: MiniAMM__factory.abi,
        functionName: "totalSupply",
      },
      {
        address: CONTRACT_ADDRESSES.pair,
        abi: MiniAMM__factory.abi,
        functionName: "balanceOf",
        args: [address ?? zeroAddressTyped],
      },
    ],
    query: {
      enabled: isConnected,
    },
  });

  useEffect(() => {
    if (!isConnected) return;
    refetchUserBalances();
    refetchPoolBalances();
    refetchLpData();
  }, [refreshKey, isConnected, address, refetchUserBalances, refetchPoolBalances, refetchLpData]);

  if (!isConnected) {
    return (
      <section className="w-full max-w-2xl space-y-3">
        <h2 className="text-lg font-semibold">Balances</h2>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to view token balances and pool reserves.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Native Balance</h2>
        <p className="font-mono text-sm bg-black/[.05] dark:bg-white/[.06] rounded px-3 py-2">
          {nativeBalance
            ? `${nativeBalance.formatted} ${nativeBalance.symbol}`
            : "Loading..."}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-md font-semibold">Wallet Tokens</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {TOKENS.map((token) => (
            <li
              key={token.id}
              className="rounded border border-black/[.08] dark:border-white/[.12] px-3 py-2"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {token.label}
              </p>
              <p className="font-mono text-sm">
                {formatAmount(userTokenData?.[token.id], token.decimals)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-md font-semibold">MiniAMM Reserves</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {TOKENS.map((token) => (
            <li
              key={token.id}
              className="rounded border border-black/[.08] dark:border-white/[.12] px-3 py-2"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {token.label}
              </p>
              <p className="font-mono text-sm">
                {formatAmount(poolTokenData?.[token.id], token.decimals)}
              </p>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-3">
          <StatCard
            label="Total LP Supply"
            value={formatAmount(lpData?.[0]?.result as bigint | undefined, lpDecimals)}
          />
          <StatCard
            label="Your LP Balance"
            value={formatAmount(lpData?.[1]?.result as bigint | undefined, lpDecimals)}
          />
          <StatCard
            label="Your Pool Share"
            value={formatLpShare(
              lpData?.[0]?.result as bigint | undefined,
              lpData?.[1]?.result as bigint | undefined,
            )}
          />
        </div>
      </div>
    </section>
  );
}

const mapResultsToTokens = (
  data:
    | readonly {
        result?: unknown;
        status: "success" | "failure" | undefined;
      }[]
    | undefined,
  tokens: TokenConfig[],
) => {
  const entries = tokens.map((token, index) => {
    const result = data?.[index]?.result;
    let value: bigint | undefined;
    if (typeof result === "bigint") {
      value = result;
    } else if (typeof result === "number") {
      value = BigInt(result);
    } else if (typeof result === "string") {
      try {
        value = BigInt(result);
      } catch (error) {
        console.warn(`Failed to parse balance for ${token.label}`, error);
      }
    }
    return [token.id, value ?? 0n];
  });
  return Object.fromEntries(entries) as Record<TokenConfig["id"], bigint>;
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-black/[.08] dark:border-white/[.12] px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-mono text-sm">{value}</p>
    </div>
  );
}

const formatLpShare = (total?: bigint, user?: bigint) => {
  if (!total || total === 0n || !user) return "-";
  const numerator = Number(user) / Number(total);
  if (!Number.isFinite(numerator)) return "-";
  return `${(numerator * 100).toFixed(2)}%`;
};

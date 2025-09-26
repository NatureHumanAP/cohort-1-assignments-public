"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { TOKENS } from "@/constants/tokens";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { MiniAMM__factory, MockERC20__factory } from "@/typechain";
import { useAccount, useConfig, useReadContracts, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";

const lpDecimals = 18;

type Props = {
  onActionComplete: () => void;
};

export function AmmActions({ onActionComplete }: Props) {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mintInputs, setMintInputs] = useState({ token0: "", token1: "" });
  const [approveInputs, setApproveInputs] = useState({ token0: "", token1: "" });
  const [liquidityInputs, setLiquidityInputs] = useState({ x: "", y: "" });
  const [removeInput, setRemoveInput] = useState("");
  const [swapInput, setSwapInput] = useState("");
  const [swapDirection, setSwapDirection] = useState<"token0" | "token1">("token0");

  const isReady = Boolean(isConnected && address);

  const {
    data: poolReserves,
    refetch: refetchPoolReserves,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.pair,
        abi: MiniAMM__factory.abi,
        functionName: "xReserve",
      },
      {
        address: CONTRACT_ADDRESSES.pair,
        abi: MiniAMM__factory.abi,
        functionName: "yReserve",
      },
    ],
    query: {
      enabled: isReady,
    },
  });

  const resetStatus = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleTransaction = async (action: () => Promise<`0x${string}`>, message: string) => {
    resetStatus();
    if (!isReady) {
      setErrorMessage("Connect wallet first");
      return;
    }
    setIsSubmitting(true);
    try {
      const hash = await action();
      setStatusMessage("Waiting for confirmation...");
      await waitForTransactionReceipt(config, { hash });
      setStatusMessage(message);
      onActionComplete();
      await refetchPoolReserves();
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message ?? "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMint = (tokenKey: "token0" | "token1") => async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();
    const amount = mintInputs[tokenKey];
    if (!amount) return;
    const token = TOKENS.find((t) => t.id === tokenKey)!;
    let parsedAmount: bigint;
    try {
      parsedAmount = parseUnits(amount, token.decimals);
    } catch (error) {
      console.warn("Invalid mint amount", error);
      setErrorMessage("Invalid amount");
      return;
    }
    await handleTransaction(
      () =>
        writeContractAsync({
          abi: MockERC20__factory.abi,
          address: token.address,
          functionName: "freeMintToSender",
          args: [parsedAmount],
        }),
      `${token.label} minted successfully`,
    );
    setMintInputs((prev) => ({ ...prev, [tokenKey]: "" }));
  };

  const handleApprove = (tokenKey: "token0" | "token1") => async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();
    const amount = approveInputs[tokenKey];
    if (!amount) return;
    const token = TOKENS.find((t) => t.id === tokenKey)!;
    let parsedAmount: bigint;
    try {
      parsedAmount = parseUnits(amount, token.decimals);
    } catch (error) {
      console.warn("Invalid approve amount", error);
      setErrorMessage("Invalid amount");
      return;
    }
    await handleTransaction(
      () =>
        writeContractAsync({
          abi: MockERC20__factory.abi,
          address: token.address,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.pair, parsedAmount],
        }),
      `${token.label} approval successful`,
    );
    setApproveInputs((prev) => ({ ...prev, [tokenKey]: "" }));
  };

  const handleAddLiquidity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();
    const { x, y } = liquidityInputs;
    if (!x || !y) return;
    let parsedX: bigint;
    let parsedY: bigint;
    try {
      parsedX = parseUnits(x, TOKENS[0].decimals);
      parsedY = parseUnits(y, TOKENS[1].decimals);
    } catch (error) {
      console.warn("Invalid liquidity amount", error);
      setErrorMessage("Invalid amount");
      return;
    }
    await handleTransaction(
      () =>
        writeContractAsync({
          ...miniAmmWriteConfig("addLiquidity"),
          args: [parsedX, parsedY],
        }),
      "Liquidity added successfully",
    );
    setLiquidityInputs({ x: "", y: "" });
  };

  const handleRemoveLiquidity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();
    if (!removeInput) return;
    let parsedAmount: bigint;
    try {
      parsedAmount = parseUnits(removeInput, lpDecimals);
    } catch (error) {
      console.warn("Invalid remove amount", error);
      setErrorMessage("Invalid amount");
      return;
    }
    await handleTransaction(
      () =>
        writeContractAsync({
          ...miniAmmWriteConfig("removeLiquidity"),
          args: [parsedAmount],
        }),
      "Liquidity removed successfully",
    );
    setRemoveInput("");
  };

  const handleSwap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();
    if (!swapInput) return;
    const direction = swapDirection;
    let amountIn: bigint;
    try {
      amountIn = parseUnits(
        swapInput,
        direction === "token0" ? TOKENS[0].decimals : TOKENS[1].decimals,
      );
    } catch (error) {
      console.warn("Invalid swap amount", error);
      setErrorMessage("Invalid amount");
      return;
    }
    const args =
      direction === "token0"
        ? [amountIn, 0n]
        : [0n, amountIn];
    await handleTransaction(
      () =>
        writeContractAsync({
          ...miniAmmWriteConfig("swap"),
          args,
        }),
      "Swap executed successfully",
    );
    setSwapInput("");
  };

  const expectedSwapOutput = useMemo(
    () =>
      computeSwapEstimate({
        reserves: poolReserves,
        direction: swapDirection,
        amountIn: swapInput,
      }),
    [poolReserves, swapDirection, swapInput],
  );

  if (!isReady) {
    return (
      <section className="w-full max-w-2xl space-y-3">
        <h2 className="text-lg font-semibold">MiniAMM Actions</h2>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to mint tokens, approve spending, manage liquidity, or swap.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-2xl space-y-8">
      <ActionStatus statusMessage={statusMessage} errorMessage={errorMessage} />

      <ActionGroup title="Mint Tokens">
        {TOKENS.map((token) => (
          <form
            key={`mint-${token.id}`}
            onSubmit={handleMint(token.id)}
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <label className="flex-1 text-sm">
              <span className="block text-xs uppercase text-muted-foreground mb-1">
                {token.label}
              </span>
              <input
                value={mintInputs[token.id]}
                onChange={(event) =>
                  setMintInputs((prev) => ({ ...prev, [token.id]: event.target.value }))
                }
                placeholder="0.0"
                type="number"
                min="0"
                step="any"
                className="w-full rounded border border-black/[.08] dark:border-white/[.12] bg-transparent px-3 py-2"
              />
            </label>
            <button
              disabled={isSubmitting}
              type="submit"
              className="sm:w-[140px] rounded bg-foreground text-background px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              Mint
            </button>
          </form>
        ))}
      </ActionGroup>

      <ActionGroup title="Approve MiniAMM">
        {TOKENS.map((token) => (
          <form
            key={`approve-${token.id}`}
            onSubmit={handleApprove(token.id)}
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <label className="flex-1 text-sm">
              <span className="block text-xs uppercase text-muted-foreground mb-1">
                {token.label}
              </span>
              <input
                value={approveInputs[token.id]}
                onChange={(event) =>
                  setApproveInputs((prev) => ({ ...prev, [token.id]: event.target.value }))
                }
                placeholder="0.0"
                type="number"
                min="0"
                step="any"
                className="w-full rounded border border-black/[.08] dark:border-white/[.12] bg-transparent px-3 py-2"
              />
            </label>
            <button
              disabled={isSubmitting}
              type="submit"
              className="sm:w-[140px] rounded bg-foreground text-background px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              Approve
            </button>
          </form>
        ))}
      </ActionGroup>

      <ActionGroup title="Add Liquidity">
        <form onSubmit={handleAddLiquidity} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <InputWithLabel
              label="Token A (TKA)"
              value={liquidityInputs.x}
              onChange={(value) =>
                setLiquidityInputs((prev) => ({ ...prev, x: value }))
              }
            />
            <InputWithLabel
              label="Token B (TKB)"
              value={liquidityInputs.y}
              onChange={(value) =>
                setLiquidityInputs((prev) => ({ ...prev, y: value }))
              }
            />
          </div>
          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full sm:w-[200px] rounded bg-foreground text-background px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            Add Liquidity
          </button>
        </form>
      </ActionGroup>

      <ActionGroup title="Remove Liquidity">
        <form onSubmit={handleRemoveLiquidity} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <InputWithLabel
            label="LP Tokens"
            value={removeInput}
            onChange={setRemoveInput}
          />
          <button
            disabled={isSubmitting}
            type="submit"
            className="sm:w-[200px] rounded bg-foreground text-background px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            Remove Liquidity
          </button>
        </form>
      </ActionGroup>

      <ActionGroup title="Swap">
        <form onSubmit={handleSwap} className="space-y-3">
          <div className="flex gap-4">
            {TOKENS.map((token) => (
              <label key={`swap-direction-${token.id}`} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="swap-direction"
                  value={token.id}
                  checked={swapDirection === token.id}
                  onChange={() => setSwapDirection(token.id)}
                />
                {token.label} → {token.id === "token0" ? TOKENS[1].label : TOKENS[0].label}
              </label>
            ))}
          </div>
          <InputWithLabel
            label="Amount to swap"
            value={swapInput}
            onChange={setSwapInput}
          />
          <p className="text-sm text-muted-foreground">
            Estimated output: {expectedSwapOutput}
          </p>
          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full sm:w-[200px] rounded bg-foreground text-background px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            Execute Swap
          </button>
        </form>
      </ActionGroup>
    </section>
  );
}

function InputWithLabel({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex-1 text-sm">
      <span className="block text-xs uppercase text-muted-foreground mb-1">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0.0"
        type="number"
        min="0"
        step="any"
        className="w-full rounded border border-black/[.08] dark:border-white/[.12] bg-transparent px-3 py-2"
      />
    </label>
  );
}

function ActionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold">{title}</h3>
      <div className="space-y-3 rounded border border-black/[.08] dark:border-white/[.12] p-4">
        {children}
      </div>
    </div>
  );
}

function ActionStatus({
  statusMessage,
  errorMessage,
}: {
  statusMessage: string | null;
  errorMessage: string | null;
}) {
  if (!statusMessage && !errorMessage) return null;
  return (
    <div
      className={`rounded border px-3 py-2 text-sm ${
        errorMessage
          ? "border-red-500/60 text-red-500"
          : "border-green-500/60 text-green-500"
      }`}
    >
      {errorMessage ?? statusMessage}
    </div>
  );
}

function miniAmmWriteConfig(functionName: "addLiquidity" | "removeLiquidity" | "swap") {
  return {
    abi: MiniAMM__factory.abi,
    address: CONTRACT_ADDRESSES.pair as `0x${string}`,
    functionName,
  } as const;
}

function computeSwapEstimate({
  reserves,
  direction,
  amountIn,
}: {
  reserves:
    | readonly {
        result?: unknown;
        status: "success" | "failure" | undefined;
      }[]
    | undefined;
  direction: "token0" | "token1";
  amountIn: string;
}) {
  if (!reserves || !amountIn) return "-";
  const [xReserve, yReserve] = reserves.map((entry) => toBigInt(entry?.result));
  if (xReserve === 0n || yReserve === 0n) return "-";

  try {
    const parsed = parseUnits(
      amountIn,
      direction === "token0" ? TOKENS[0].decimals : TOKENS[1].decimals,
    );
    const amountInWithFee = (parsed * 997_000n) / 1_000_000n;
    const [reserveIn, reserveOut] =
      direction === "token0" ? [xReserve, yReserve] : [yReserve, xReserve];

    const newReserveIn = reserveIn + amountInWithFee;
    if (newReserveIn === 0n) return "-";

    const newReserveOut = (reserveIn * reserveOut) / newReserveIn;
    const amountOut = reserveOut - newReserveOut;

    const decimals = direction === "token0" ? TOKENS[1].decimals : TOKENS[0].decimals;
    return `${Number.parseFloat(formatUnits(amountOut, decimals)).toFixed(4)} ${
      direction === "token0" ? "TKB" : "TKA"
    }`;
  } catch (error) {
    console.warn("Failed to compute swap estimate", error);
    return "-";
  }
}

function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string" && value) {
    try {
      return BigInt(value);
    } catch (error) {
      console.warn("Failed to convert string to bigint", error);
      return 0n;
    }
  }
  return 0n;
}

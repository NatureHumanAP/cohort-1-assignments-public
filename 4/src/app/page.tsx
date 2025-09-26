"use client";

import Image from "next/image";
import { useState } from "react";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TokenBalances } from "@/components/token-balances";
import { AmmActions } from "@/components/amm-actions";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <ConnectButton showBalance={false} />
        <Image
          className="dark:invert"
          src="/hell-month.svg"
          alt="Hell Month logo"
          width={240}
          height={60}
          priority
        />
        <section className="flex flex-col gap-4 w-full max-w-2xl">
          <h1 className="text-xl font-semibold">Deployed Contracts (Flare Coston2)</h1>
          <ul className="bg-black/[.05] dark:bg-white/[.06] rounded p-4 font-mono text-xs sm:text-sm space-y-2">
            <li>
              <span className="font-semibold">Factory:</span> {CONTRACT_ADDRESSES.factory}
            </li>
            <li>
              <span className="font-semibold">Token0:</span> {CONTRACT_ADDRESSES.token0}
            </li>
            <li>
              <span className="font-semibold">Token1:</span> {CONTRACT_ADDRESSES.token1}
            </li>
            <li>
              <span className="font-semibold">MiniAMM Pair:</span> {CONTRACT_ADDRESSES.pair}
            </li>
          </ul>
          <p className="text-sm text-center sm:text-left">
            Start wiring RainbowKit, swap logic, and liquidity flows with the typed helpers in
            <code className="ml-1 px-1 py-0.5 bg-black/[.05] dark:bg-white/[.06] rounded">src/lib/contracts.ts</code>.
          </p>
        </section>

        <TokenBalances refreshKey={refreshKey} />

        <AmmActions onActionComplete={handleRefresh} />

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

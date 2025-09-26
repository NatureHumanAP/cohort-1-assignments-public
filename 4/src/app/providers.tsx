"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { http } from "wagmi";
import { type ReactNode } from "react";
import { defineChain } from "viem";

const coston2 = defineChain({
  id: 114,
  name: "Flare Coston2",
  nativeCurrency: { name: "Coston2 FLR", symbol: "C2FLR", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_FLARE_RPC_URL ??
          "https://coston2-api.flare.network/ext/C/rpc",
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_FLARE_RPC_URL ??
          "https://coston2-api.flare.network/ext/C/rpc",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://coston2-explorer.flare.network",
    },
  },
  testnet: true,
});

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

if (!projectId) {
  console.warn(
    "NEXT_PUBLIC_WC_PROJECT_ID is not set. WalletConnect based connectors will be disabled.",
  );
}

const wagmiConfig = getDefaultConfig({
  appName: "MiniAMM Frontend",
  projectId: projectId || "demo",
  chains: [coston2],
  ssr: true,
  transports: {
    [coston2.id]: http(
      process.env.NEXT_PUBLIC_FLARE_RPC_URL ??
        "https://coston2-api.flare.network/ext/C/rpc",
    ),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

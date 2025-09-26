This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Hell Month Frontend Enhancements

### Tech Stack
- **Next.js 15** (App Router, SSR/CSR hybrid)
- **React 19 + TypeScript**
- **RainbowKit + wagmi + viem** for wallet connectivity and EVM RPC calls
- **Ethers v6** auto-generated TypeChain factories for MiniAMM + MockERC20
- **TanStack Query** to cache on-chain reads
- **Tailwind v4 (pre-release)** utility styling from the default template

### Implemented Features
- Wallet connect/disconnect via RainbowKit (WalletConnect v2 + injected wallets)
- Live display of deployed contract addresses, wallet balances, and MiniAMM reserves
- Forms to mint MockERC20 tokens, approve MiniAMM spending, add/remove liquidity, and swap between Token A/Token B with constant product estimation
- Real-time status/error feedback and automatic balance refresh after each transaction

### Environment Requirements
Create a `.env.local` at the project root (same level as `package.json`) with:  

```
NEXT_PUBLIC_FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
NEXT_PUBLIC_WC_PROJECT_ID=<WalletConnect Project ID>
NEXT_PUBLIC_MINI_AMM_FACTORY_ADDRESS=< deployed MiniAMMFactory address >
NEXT_PUBLIC_MOCK_TOKEN0_ADDRESS=< deployed Token A address >
NEXT_PUBLIC_MOCK_TOKEN1_ADDRESS=< deployed Token B address >
NEXT_PUBLIC_MINI_AMM_PAIR_ADDRESS=< deployed MiniAMM pair address >
```

Optional server-only keys (used by scripts) can live in `.dev.vars` or your shell:

```
FLARE_COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
DEPLOYER_PRIVATE_KEY=<hex private key>
DEPLOYER_ADDRESS=<0x...>
MINI_AMM_FACTORY_ADDRESS=<same as above>
MOCK_TOKEN0_ADDRESS=<same as above>
MOCK_TOKEN1_ADDRESS=<same as above>
MINI_AMM_PAIR_ADDRESS=<same as above>
```

### Required Services & How to Obtain Keys
- **WalletConnect Project ID**: Sign in at [WalletConnect Cloud](https://cloud.walletconnect.com), create a project, and copy the generated ID into `NEXT_PUBLIC_WC_PROJECT_ID`.
- **Flare Coston2 RPC**: Public endpoint already supplied (`https://coston2-api.flare.network/ext/C/rpc`). Replace if you have your own provider.
- **Deployer Private Key**: Use a funded EOA on Flare Coston2. Store in `.dev.vars` or shell only (never commit).

After the env is configured:

```bash
cd 4
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect a wallet (MetaMask, etc.) to the **Flare Coston2** network to interact with the DApp.

import { ethers } from "ethers";
import {
  MiniAMMFactory__factory,
  MiniAMM__factory,
  MockERC20__factory,
} from "@/typechain";

const env = {
  factory:
    process.env.NEXT_PUBLIC_MINI_AMM_FACTORY_ADDRESS ??
    process.env.MINI_AMM_FACTORY_ADDRESS ??
    "",
  token0:
    process.env.NEXT_PUBLIC_MOCK_TOKEN0_ADDRESS ??
    process.env.MOCK_TOKEN0_ADDRESS ??
    "",
  token1:
    process.env.NEXT_PUBLIC_MOCK_TOKEN1_ADDRESS ??
    process.env.MOCK_TOKEN1_ADDRESS ??
    "",
  pair:
    process.env.NEXT_PUBLIC_MINI_AMM_PAIR_ADDRESS ??
    process.env.MINI_AMM_PAIR_ADDRESS ??
    "",
} as const;

for (const [key, value] of Object.entries(env)) {
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const CONTRACT_ADDRESSES = env;

type SignerOrProvider = ethers.Signer | ethers.AbstractProvider;

export const getMiniAMMFactory = (signerOrProvider: SignerOrProvider) =>
  MiniAMMFactory__factory.connect(CONTRACT_ADDRESSES.factory, signerOrProvider);

export const getMiniAMM = (signerOrProvider: SignerOrProvider) =>
  MiniAMM__factory.connect(CONTRACT_ADDRESSES.pair, signerOrProvider);

export const getMockToken0 = (signerOrProvider: SignerOrProvider) =>
  MockERC20__factory.connect(CONTRACT_ADDRESSES.token0, signerOrProvider);

export const getMockToken1 = (signerOrProvider: SignerOrProvider) =>
  MockERC20__factory.connect(CONTRACT_ADDRESSES.token1, signerOrProvider);

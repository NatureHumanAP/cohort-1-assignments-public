import { ethers } from "ethers";
import {
  MiniAMMFactory__factory,
  MiniAMM__factory,
  MockERC20__factory,
} from "@/typechain";

const withEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const CONTRACT_ADDRESSES = {
  factory: withEnv("NEXT_PUBLIC_MINI_AMM_FACTORY_ADDRESS"),
  token0: withEnv("NEXT_PUBLIC_MOCK_TOKEN0_ADDRESS"),
  token1: withEnv("NEXT_PUBLIC_MOCK_TOKEN1_ADDRESS"),
  pair: withEnv("NEXT_PUBLIC_MINI_AMM_PAIR_ADDRESS"),
} as const;

type SignerOrProvider = ethers.Signer | ethers.AbstractProvider;

export const getMiniAMMFactory = (signerOrProvider: SignerOrProvider) =>
  MiniAMMFactory__factory.connect(CONTRACT_ADDRESSES.factory, signerOrProvider);

export const getMiniAMM = (signerOrProvider: SignerOrProvider) =>
  MiniAMM__factory.connect(CONTRACT_ADDRESSES.pair, signerOrProvider);

export const getMockToken0 = (signerOrProvider: SignerOrProvider) =>
  MockERC20__factory.connect(CONTRACT_ADDRESSES.token0, signerOrProvider);

export const getMockToken1 = (signerOrProvider: SignerOrProvider) =>
  MockERC20__factory.connect(CONTRACT_ADDRESSES.token1, signerOrProvider);

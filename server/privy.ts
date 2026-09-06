import { PrivyClient } from "@privy-io/node";
import { encodeFunctionData, toHex } from "viem";
import { config } from "./config";

export const privy = new PrivyClient({
  appId: config.privyAppId,
  appSecret: config.privyAppSecret,
});

const savingsCircleAbi = [
  {
    type: "function",
    name: "contribute",
    stateMutability: "payable",
    inputs: [
      {
        name: "period",
        type: "uint256",
      },
    ],
    outputs: [],
  },
] as const;

export function contributionTransaction(period: string) {
  return {
    to: config.contributionContract,
    value: toHex(config.contributionWei),
    chain_id: config.chainId,
    data: encodeFunctionData({
      abi: savingsCircleAbi,
      functionName: "contribute",
      args: [BigInt(period)],
    }),
  };
}

export async function sendContribution(
  walletId: string,
  period: string,
) {
  const idempotencyKey = `circle-contribution:${walletId}:${period}`;

  return privy.wallets().ethereum().sendTransaction(walletId, {
    idempotency_key: idempotencyKey,

    caip2: config.caip2,

    params: {
      transaction: contributionTransaction(period),
    },

    authorization_context: {
      authorization_private_keys: [
        config.authorizationPrivateKey,
      ],
    },
  });
}
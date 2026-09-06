import "dotenv/config";
import { PrivyClient } from "@privy-io/node";

const appId = process.env.PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;
const contract = process.env.CONTRIBUTION_CONTRACT_ADDRESS;

if (!appId || !appSecret || !contract) {
  throw new Error(
    "PRIVY_APP_ID, PRIVY_APP_SECRET and CONTRIBUTION_CONTRACT_ADDRESS are required.",
  );
}

const privy = new PrivyClient({
  appId,
  appSecret,
});

const policy = await privy.policies().create({
  name: "CirclePay Weekly Contribution",
  version: "1.0",
  chain_type: "ethereum",
  rules: [
    {
      name: "Only SavingsCircle on Base Sepolia",
      method: "eth_sendTransaction",
      action: "ALLOW",
      conditions: [
        {
          field_source: "ethereum_transaction",
          field: "to",
          operator: "eq",
          value: contract,
        },
        {
          field_source: "ethereum_transaction",
          field: "chain_id",
          operator: "eq",
          value: "84532",
        },
        {
          field_source: "ethereum_transaction",
          field: "value",
          operator: "lte",
          value: "1000000000000000"
        },
        {
          field_source: "ethereum_calldata",
          field: "function_name",
          operator: "eq",
          value: "contribute",
          abi: [
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
          ],
        },
        {
          field_source: "system",
          field: "current_unix_timestamp",
          operator: "lt",
          value: "1798675200",
        },
      ],
    },
    {
      name: "Deny private key export",
      method: "exportPrivateKey",
      action: "DENY",
      conditions: [],
    },
  ],
});

console.log("Created policy:");
console.log(policy.id);
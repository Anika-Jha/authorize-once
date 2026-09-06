# Authorize Once

Weekly savings-circle contributions with scoped, revocable Privy wallet authorization.

Built for **Road To Devcon III — Authorize Once, Then Stop Asking**.

## What it does

A member authorizes the CirclePay server once when joining.

That authorization allows the server to make the member's weekly contribution while the member is offline.

The permission is:

- Base Sepolia only
- `SavingsCircle` contract only
- `contribute()` only
- Maximum `0.001 ETH` per transaction
- Expires 31 December 2026
- Revocable by the member

The server cannot use the authorization key to perform arbitrary wallet actions.

## Architecture

```text
Member
  │
  │  one-time authorization
  ▼
Privy embedded wallet
  │
  │  scoped signer + policy
  ▼
Privy authorization key
  │
  ▼
Weekly scheduler
  │
  ├── already settled?
  │       └── skip
  │
  └── send contribution
          │
          ▼
     Privy policy engine
          │
          ├── contract ✓
          ├── Base Sepolia ✓
          ├── amount ≤ 0.001 ETH ✓
          ├── contribute() ✓
          └── before expiry ✓
                  │
                  ▼
           SavingsCircle
```

## Demo

The flow is:

1. Connect a Privy wallet.
2. Join the savings circle.
3. Authorize the weekly contribution once.
4. The server can execute future weekly contributions without requiring the member to be online.
5. The member can revoke the authorization at any time.

The weekly contribution endpoint can also be triggered manually for testing.


## Safety

The permission is enforced by Privy's policy engine rather than application checks alone.

The committed policy restricts:

-   destination contract
-   network
-   transaction value
-   contract function
-   expiry

The policy is allow-only, so unmatched wallet actions remain denied.

Members can revoke the delegated signer from the product at any time.

## Idempotency

Each contribution is identified by:

```
wallet + weekly period
```

The server records the period before execution and uses a deterministic Privy idempotency key:

```
circle-contribution:<walletId>:<period>
```

The on-chain contract also rejects duplicate contributions for the same member and period.

## Setup

Install:

```
npm install
```

Configure `.env.local` using `.env.example`.

Create a Privy authorization key and register it in the Privy Dashboard.

Deploy `SavingsCircle.sol` to Base Sepolia with:

```
0.001 ETH
```

Create the Privy policy using:

```
npx tsx scripts/create-policy.ts
```

Put the resulting policy ID and authorization signer ID in `.env.local`.

Run:

```
npm run dev
```

The weekly job can be tested locally with:

```
curl -X POST http://localhost:3000/api/weekly-run \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Security boundary

The authorization private key is server-only and is never committed.

`.env.local` and runtime state are gitignored.

The member's wallet remains under their control; the application receives only the scoped transaction authority explicitly granted through Privy.

The result is a contribution flow that works in the background without turning a weekly savings commitment into an unlimited wallet permission. Members authorize once, retain visibility and control, and can revoke access when they choose.

## Key Design Decision

The application does not store or control the member's wallet private key.

Instead, the member explicitly delegates a narrowly scoped authorization through Privy. The server can use that authorization only for the permitted weekly contribution flow.

This separates **wallet ownership** from **transaction execution**: the member retains control while the application handles recurring execution.

## Tech Stack

- Next.js + TypeScript
- Privy Wallets & Authorization
- Solidity + Foundry
- Base Sepolia
- Vercel Cron
- viem

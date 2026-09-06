"use client";

import {
  usePrivy,
  useSigners,
} from "@privy-io/react-auth";
import { useMemo, useState } from "react";

const SIGNER_ID = process.env.NEXT_PUBLIC_AUTHORIZATION_SIGNER_ID!;
const POLICY_ID = process.env.NEXT_PUBLIC_CONTRIBUTION_POLICY_ID!;

export default function CircleDashboard() {
  const { user, logout } = usePrivy();
  const { addSigners, removeSigners } = useSigners();

  const [status, setStatus] = useState<
    "idle" | "authorizing" | "authorized" | "revoking" | "revoked" | "error"
  >("idle");

  const [error, setError] = useState<string | null>(null);

  const wallet = useMemo(() => {
    return user?.wallet ?? null;
  }, [user]);

  const isDelegated = useMemo(() => {
    const linkedWallet = user?.linkedAccounts?.find(
      (account) =>
        account.type === "wallet" &&
        account.walletClientType === "privy",
    );

    return Boolean(linkedWallet && "delegated" in linkedWallet && linkedWallet.delegated);
  }, [user]);

  async function authorize() {
    if (!wallet) {
      setError("Your Privy wallet is not ready.");
      setStatus("error");
      return;
    }

    if (!SIGNER_ID || !POLICY_ID) {
      setError(
        "The authorization signer or policy is not configured.",
      );
      setStatus("error");
      return;
    }

    try {
      setStatus("authorizing");
      setError(null);

      /*
       * ONE-TIME GRANT
       *
       * The member explicitly adds our server authorization key as a
       * signer and attaches the restrictive contribution policy.
       */
      await addSigners({
        address: wallet.address,
        signers: [
          {
            signerId: SIGNER_ID,
            policyIds: [POLICY_ID],
          },
        ],
      });

      await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletId: wallet.id,
          address: wallet.address,
        }),
      });

      setStatus("authorized");
    } catch (err) {
      setStatus("error");

      setError(
        err instanceof Error
          ? err.message
          : "Authorization was rejected.",
      );
    }
  }

  async function revoke() {
    if (!wallet) return;

    try {
      setStatus("revoking");
      setError(null);

      /*
       * USER-REACHABLE REVOCATION
       *
       * Privy removes the delegated signer from this wallet.
       * The server therefore loses its delegated transaction permission.
       */
      await removeSigners({
        address: wallet.address,
      });

      setStatus("revoked");
    } catch (err) {
      setStatus("error");

      setError(
        err instanceof Error
          ? err.message
          : "Revocation failed.",
      );
    }
  }

  if (!wallet) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-950 text-white">
        Creating your wallet…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              CirclePay
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Your savings circle
            </h1>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
          >
            Sign out
          </button>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-7">
          <p className="text-sm text-slate-500">
            Your wallet
          </p>

          <p className="mt-2 break-all font-mono text-sm text-slate-300">
            {wallet.address}
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Weekly contribution
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                0.001 ETH
              </h2>

              <p className="mt-2 max-w-2xl leading-7 text-slate-400">
                Your contribution can be sent automatically every week
                without opening this app.
              </p>
            </div>

            <div className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
              Base Sepolia
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <PermissionCard
              title="Only one contract"
              text="The server can only call the committed savings-circle contract."
            />

            <PermissionCard
              title="Maximum 0.001 ETH"
              text="The value ceiling is enforced by Privy's policy engine."
            />

            <PermissionCard
              title="Expires 31 Dec 2026"
              text="The policy stops authorizing transactions after expiry."
            />

            <PermissionCard
              title="You can revoke"
              text="Remove the server signer from your wallet whenever you want."
            />
          </div>

          {!isDelegated &&
            status !== "authorized" &&
            status !== "revoked" && (
              <button
                onClick={authorize}
                disabled={status === "authorizing"}
                className="mt-8 w-full rounded-xl bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-200 disabled:opacity-50"
              >
                {status === "authorizing"
                  ? "Authorizing…"
                  : "Authorize weekly contribution"}
              </button>
            )}

          {(isDelegated || status === "authorized") &&
            status !== "revoked" && (
              <div className="mt-8">
                <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-4">
                  <p className="font-bold text-emerald-300">
                    Authorization active
                  </p>

                  <p className="mt-1 text-sm leading-6 text-emerald-400/70">
                    The server can now make policy-compliant weekly
                    contributions while you are offline.
                  </p>
                </div>

                <button
                  onClick={revoke}
                  disabled={status === "revoking"}
                  className="mt-4 w-full rounded-xl border border-red-900 px-6 py-3 font-bold text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                >
                  {status === "revoking"
                    ? "Revoking…"
                    : "Revoke authorization"}
                </button>
              </div>
            )}

          {status === "revoked" && (
            <div className="mt-8 rounded-xl border border-amber-900 bg-amber-950/30 p-4">
              <p className="font-bold text-amber-300">
                Authorization revoked
              </p>

              <p className="mt-1 text-sm text-amber-400/70">
                The server can no longer make delegated contributions.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-7">
          <h2 className="text-xl font-bold">
            Why this is safe
          </h2>

          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
            <li>• The server never receives your private key.</li>
            <li>• Its authorization key is policy-scoped.</li>
            <li>• Other contracts are rejected.</li>
            <li>• Larger payments are rejected.</li>
            <li>• The permission expires automatically.</li>
            <li>• You can revoke it yourself.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function PermissionCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}
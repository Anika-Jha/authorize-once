"use client";

import { usePrivy } from "@privy-io/react-auth";
import CircleDashboard from "./components/CircleDashboard";

export default function Home() {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-950 text-white">
        <p className="text-slate-400">Preparing CirclePay…</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <section>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
                CirclePay
              </p>

              <h1 className="mt-5 text-5xl font-bold tracking-tight md:text-6xl">
                Authorize once.
                <br />
                Then stop asking.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                Join Meera&apos;s weekly savings circle and authorize one
                tightly-scoped contribution permission. After that, your
                weekly contribution can happen while you&apos;re offline.
              </p>

              <button
                onClick={login}
                className="mt-8 rounded-xl bg-white px-6 py-3 font-bold text-slate-950 hover:bg-slate-200"
              >
                Join the circle
              </button>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
              <p className="text-sm font-semibold text-slate-400">
                What you authorize
              </p>

              <div className="mt-6 space-y-4">
                <Permission
                  label="Network"
                  value="Base Sepolia"
                />

                <Permission
                  label="Action"
                  value="Weekly contribution"
                />

                <Permission
                  label="Maximum"
                  value="0.001 ETH / contribution"
                />

                <Permission
                  label="Expiry"
                  value="31 December 2026"
                />
              </div>

              <p className="mt-6 border-t border-slate-800 pt-5 text-sm leading-6 text-slate-500">
                You can revoke this permission from the product at any time.
              </p>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return <CircleDashboard />;
}

function Permission({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-white">{value}</span>
    </div>
  );
}
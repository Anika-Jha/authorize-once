import { NextResponse } from "next/server";
import {
  beginContribution,
  finishContribution,
  getMembers,
} from "@/server/ledger";
import { sendContribution } from "@/server/privy";
import { config } from "@/server/config";

export const runtime = "nodejs";

function currentPeriod(): string {
  const now = new Date();

  const year = now.getUTCFullYear();

  const firstDay = new Date(
    Date.UTC(year, 0, 1),
  );

  const dayOfYear =
    Math.floor(
      (now.getTime() - firstDay.getTime()) /
        86_400_000,
    ) + 1;

  const week = Math.ceil(
    (dayOfYear + firstDay.getUTCDay()) / 7,
  );

  return `${year}-W${String(week).padStart(2, "0")}`;
}

function authorized(request: Request): boolean {
  if (!config.cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return (
    request.headers.get("authorization") ===
    `Bearer ${config.cronSecret}`
  );
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const period = currentPeriod();
  const members = await getMembers();

  const results = [];

  for (const member of members) {
    /*
     * Persistent idempotency boundary:
     *
     * If this period is already recorded, the member is skipped.
     */
    const started = await beginContribution(
      member.walletId,
      period,
    );

    if (!started) {
      results.push({
        walletId: member.walletId,
        status: "already-settled",
      });

      continue;
    }

    try {
      const response = await sendContribution(
        member.walletId,
        period,
      );

      await finishContribution(
        member.walletId,
        period,
        {
          status: "confirmed",
          txHash: response.hash,
        },
      );

      results.push({
        walletId: member.walletId,
        status: "confirmed",
        txHash: response.hash,
      });
    } catch (error) {
      /*
       * A revoked/expired signer must not abort the entire run.
       */
      const message =
        error instanceof Error
          ? error.message
          : "Contribution rejected.";

      await finishContribution(
        member.walletId,
        period,
        {
          status: "failed",
          error: message,
        },
      );

      results.push({
        walletId: member.walletId,
        status: "failed",
        error: message,
      });
    }
  }

  return NextResponse.json({
    period,
    membersProcessed: members.length,
    results,
  });
}
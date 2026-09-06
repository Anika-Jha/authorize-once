import { NextResponse } from "next/server";
import { registerMember } from "@/server/ledger";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      typeof body.walletId !== "string" ||
      typeof body.address !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid member data." },
        { status: 400 },
      );
    }

    await registerMember({
      walletId: body.walletId,
      address: body.address,
      joinedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not register member." },
      { status: 500 },
    );
  }
}
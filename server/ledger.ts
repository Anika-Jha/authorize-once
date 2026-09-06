import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "circle-state.json");
const LOCK_FILE = path.join(DATA_DIR, ".circle-state.lock");

export type Member = {
  walletId: string;
  address: string;
  joinedAt: string;
};

export type Contribution = {
  walletId: string;
  period: string;
  status: "pending" | "confirmed" | "failed";
  txHash?: string;
  error?: string;
  updatedAt: string;
};

type State = {
  members: Member[];
  contributions: Contribution[];
};

async function ensureState(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STATE_FILE);
  } catch {
    await fs.writeFile(
      STATE_FILE,
      JSON.stringify(
        {
          members: [],
          contributions: [],
        } satisfies State,
        null,
        2,
      ),
    );
  }
}

async function readState(): Promise<State> {
  await ensureState();

  return JSON.parse(
    await fs.readFile(STATE_FILE, "utf8"),
  ) as State;
}

async function writeState(state: State): Promise<void> {
  const temp = `${STATE_FILE}.tmp`;

  await fs.writeFile(
    temp,
    JSON.stringify(state, null, 2),
  );

  await fs.rename(temp, STATE_FILE);
}

async function acquireLock(): Promise<void> {
  await ensureState();

  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const handle = await fs.open(LOCK_FILE, "wx");
      await handle.close();
      return;
    } catch {
      await new Promise((resolve) =>
        setTimeout(resolve, 100),
      );
    }
  }

  throw new Error("Could not acquire state lock.");
}

async function releaseLock(): Promise<void> {
  await fs.rm(LOCK_FILE, { force: true });
}

export async function registerMember(
  member: Member,
): Promise<void> {
  await acquireLock();

  try {
    const state = await readState();

    const exists = state.members.some(
      (item) => item.walletId === member.walletId,
    );

    if (!exists) {
      state.members.push(member);
      await writeState(state);
    }
  } finally {
    await releaseLock();
  }
}

export async function getMembers(): Promise<Member[]> {
  return (await readState()).members;
}

export async function getContribution(
  walletId: string,
  period: string,
): Promise<Contribution | undefined> {
  const state = await readState();

  return state.contributions.find(
    (item) =>
      item.walletId === walletId &&
      item.period === period,
  );
}

export async function beginContribution(
  walletId: string,
  period: string,
): Promise<boolean> {
  await acquireLock();

  try {
    const state = await readState();

    const existing = state.contributions.find(
      (item) =>
        item.walletId === walletId &&
        item.period === period,
    );

    if (existing) {
      return false;
    }

    state.contributions.push({
      walletId,
      period,
      status: "pending",
      updatedAt: new Date().toISOString(),
    });

    await writeState(state);

    return true;
  } finally {
    await releaseLock();
  }
}

export async function finishContribution(
  walletId: string,
  period: string,
  update: Pick<Contribution, "status" | "txHash" | "error">,
): Promise<void> {
  await acquireLock();

  try {
    const state = await readState();

    const contribution = state.contributions.find(
      (item) =>
        item.walletId === walletId &&
        item.period === period,
    );

    if (!contribution) {
      return;
    }

    Object.assign(contribution, update, {
      updatedAt: new Date().toISOString(),
    });

    await writeState(state);
  } finally {
    await releaseLock();
  }
}
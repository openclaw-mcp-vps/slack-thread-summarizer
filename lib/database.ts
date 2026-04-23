import { promises as fs } from "node:fs";
import path from "node:path";

export type SlackInstallation = {
  teamId: string;
  teamName: string;
  teamDomain?: string;
  botToken: string;
  botUserId?: string;
  installedAt: string;
  enterpriseId?: string;
};

type UsageRecord = {
  teamId: string;
  date: string;
  summaries: number;
  lastSummaryAt: string;
};

type PaidSession = {
  sessionId: string;
  purchasedAt: string;
  customerEmail?: string;
};

type StoreData = {
  installations: Record<string, SlackInstallation>;
  usage: Record<string, UsageRecord>;
  paidSessions: Record<string, PaidSession>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const EMPTY_STORE: StoreData = {
  installations: {},
  usage: {},
  paidSessions: {},
};

let mutationQueue: Promise<unknown> = Promise.resolve();

async function ensureStoreExists() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
  }
}

async function readStoreUnsafe(): Promise<StoreData> {
  await ensureStoreExists();

  try {
    const file = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(file) as Partial<StoreData>;

    return {
      installations: parsed.installations ?? {},
      usage: parsed.usage ?? {},
      paidSessions: parsed.paidSessions ?? {},
    };
  } catch {
    return { ...EMPTY_STORE };
  }
}

async function writeStoreUnsafe(store: StoreData) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function withMutation<T>(mutator: (store: StoreData) => Promise<T> | T): Promise<T> {
  const task = mutationQueue.then(async () => {
    const store = await readStoreUnsafe();
    const result = await mutator(store);
    await writeStoreUnsafe(store);
    return result;
  });

  mutationQueue = task.catch(() => undefined);
  return task;
}

export async function saveInstallation(installation: SlackInstallation) {
  await withMutation((store) => {
    store.installations[installation.teamId] = installation;
  });
}

export async function getInstallation(teamId: string) {
  const store = await readStoreUnsafe();
  return store.installations[teamId] ?? null;
}

export async function getInstallationByDomain(domain: string) {
  const store = await readStoreUnsafe();
  const normalized = domain.trim().toLowerCase();

  return (
    Object.values(store.installations).find((installation) => installation.teamDomain?.toLowerCase() === normalized) ?? null
  );
}

export async function listInstallations() {
  const store = await readStoreUnsafe();
  return Object.values(store.installations).sort((a, b) => a.teamName.localeCompare(b.teamName));
}

function getUsageKey(teamId: string, date: string) {
  return `${teamId}:${date}`;
}

export async function incrementUsage(teamId: string) {
  const today = new Date().toISOString().slice(0, 10);

  return withMutation((store) => {
    const key = getUsageKey(teamId, today);
    const current = store.usage[key] ?? {
      teamId,
      date: today,
      summaries: 0,
      lastSummaryAt: new Date().toISOString(),
    };

    current.summaries += 1;
    current.lastSummaryAt = new Date().toISOString();

    store.usage[key] = current;

    return current.summaries;
  });
}

export async function getUsageSnapshot() {
  const store = await readStoreUnsafe();
  const today = new Date().toISOString().slice(0, 10);

  let totalToday = 0;
  let totalAllTime = 0;

  Object.values(store.usage).forEach((record) => {
    totalAllTime += record.summaries;
    if (record.date === today) {
      totalToday += record.summaries;
    }
  });

  return { totalToday, totalAllTime };
}

export async function getTeamUsageToday(teamId: string) {
  const store = await readStoreUnsafe();
  const today = new Date().toISOString().slice(0, 10);
  const record = store.usage[getUsageKey(teamId, today)];

  return record?.summaries ?? 0;
}

export async function recordPaidSession(sessionId: string, customerEmail?: string) {
  await withMutation((store) => {
    store.paidSessions[sessionId] = {
      sessionId,
      customerEmail,
      purchasedAt: new Date().toISOString(),
    };
  });
}

export async function hasPaidSession(sessionId: string) {
  const store = await readStoreUnsafe();
  return Boolean(store.paidSessions[sessionId]);
}

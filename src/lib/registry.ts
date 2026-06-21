/**
 * Registry MaintProof berbasis Solana "lite":
 * - Bukti registrasi disimpan ON-CHAIN sebagai memo transaction di Solana Devnet.
 * - Index ringan (signature + metadata + status progress) di-cache di
 *   localStorage. Sumber kebenaran integritas dokumen tetap blockchain;
 *   field status/timeline adalah lapisan operasional di atasnya.
 */
import type { MaintenanceType } from "@/data/equipment";
import {
  MAINTENANCE_STATUSES,
  type MaintenanceStatus,
  type TimelineEvent,
} from "@/lib/status";

export type MaintenanceRecord = {
  fileHash: string; // 0x... SHA-256
  equipmentCode: string;
  equipmentName?: string;
  maintenanceType: MaintenanceType;
  note: string;
  registeredAt: number; // unix seconds
  registeredBy: string; // base58 wallet address
  signature: string; // Solana transaction signature
  status: MaintenanceStatus;
  events: TimelineEvent[];
};

export const MEMO_VERSION = "maintproof.v1";

export type MemoPayload = {
  app: typeof MEMO_VERSION;
  hash: string;
  eq: string;
  eqName?: string;
  type: MaintenanceType;
  note: string;
  ts: number;
};

const STORAGE_KEY = "maintproof:registry:solana:v1";

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Migrasi record lama yang belum punya status/events. */
function normalize(raw: any): MaintenanceRecord {
  const status: MaintenanceStatus = MAINTENANCE_STATUSES.includes(raw?.status)
    ? raw.status
    : "Scheduled";
  const events: TimelineEvent[] = Array.isArray(raw?.events) && raw.events.length
    ? raw.events
    : [
        {
          id: genId(),
          kind: "created",
          ts: raw.registeredAt,
          actor: raw.registeredBy,
        },
        {
          id: genId(),
          kind: "document_uploaded",
          ts: raw.registeredAt,
          actor: raw.registeredBy,
        },
      ];
  return { ...raw, status, events };
}

function readAll(): MaintenanceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch {
    return [];
  }
}

function writeAll(records: MaintenanceRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent("maintproof:updated"));
}

export function getAllRecords(): MaintenanceRecord[] {
  return [...readAll()].sort((a, b) => b.registeredAt - a.registeredAt);
}

export function getRecordCount(): number {
  return readAll().length;
}

export function getRecordBySignature(signature: string): MaintenanceRecord | null {
  return readAll().find((r) => r.signature === signature) ?? null;
}

export function verifyRecord(fileHash: string): MaintenanceRecord | null {
  const lower = fileHash.toLowerCase();
  return (
    readAll().find((r) => r.fileHash.toLowerCase() === lower) ?? null
  );
}

export class DuplicateHashError extends Error {
  constructor() {
    super("Hash dokumen ini sudah pernah didaftarkan di blockchain.");
  }
}

export function hasHash(fileHash: string): boolean {
  return readAll().some(
    (r) => r.fileHash.toLowerCase() === fileHash.toLowerCase(),
  );
}

export function appendRecord(record: Omit<MaintenanceRecord, "status" | "events"> & {
  status?: MaintenanceStatus;
  events?: TimelineEvent[];
}) {
  const all = readAll();
  if (all.some((r) => r.signature === record.signature)) return;
  const initialEvents: TimelineEvent[] = record.events ?? [
    {
      id: genId(),
      kind: "created",
      ts: record.registeredAt,
      actor: record.registeredBy,
    },
    {
      id: genId(),
      kind: "document_uploaded",
      ts: record.registeredAt,
      actor: record.registeredBy,
      note: record.fileHash,
    },
  ];
  const full: MaintenanceRecord = {
    ...record,
    status: record.status ?? "Scheduled",
    events: initialEvents,
  };
  writeAll([...all, full]);
}

/** Update status sebuah record + catat di timeline. */
export function updateRecordStatus(
  signature: string,
  next: MaintenanceStatus,
  actor: string,
): MaintenanceRecord | null {
  const all = readAll();
  const idx = all.findIndex((r) => r.signature === signature);
  if (idx === -1) return null;
  const current = all[idx];
  if (current.status === next) return current;
  const ev: TimelineEvent = {
    id: genId(),
    kind: "status_changed",
    ts: Math.floor(Date.now() / 1000),
    actor,
    from: current.status,
    to: next,
  };
  const updated: MaintenanceRecord = {
    ...current,
    status: next,
    events: [...current.events, ev],
  };
  const copy = [...all];
  copy[idx] = updated;
  writeAll(copy);
  return updated;
}

export function buildMemoPayload(input: {
  fileHash: string;
  equipmentCode: string;
  equipmentName?: string;
  maintenanceType: MaintenanceType;
  note: string;
}): MemoPayload {
  return {
    app: MEMO_VERSION,
    hash: input.fileHash,
    eq: input.equipmentCode,
    eqName: input.equipmentName,
    type: input.maintenanceType,
    note: input.note,
    ts: Math.floor(Date.now() / 1000),
  };
}

export function subscribeRegistry(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener("maintproof:updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("maintproof:updated", handler);
    window.removeEventListener("storage", handler);
  };
}

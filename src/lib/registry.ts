/**
 * Mock blockchain registry — menyimulasikan smart contract MaintenanceRegistry
 * di localStorage. Saat smart contract real sudah di-deploy ke Sepolia, ganti
 * implementasi ini dengan call wagmi/viem ke contract address.
 */
import type { MaintenanceType } from "@/data/equipment";

export type MaintenanceRecord = {
  fileHash: string; // 0x...
  equipmentCode: string;
  maintenanceType: MaintenanceType;
  note: string;
  registeredAt: number; // unix seconds
  registeredBy: string; // wallet address
  txHash: string; // simulated tx hash
};

const STORAGE_KEY = "maintproof:registry:v1";

function readAll(): MaintenanceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: MaintenanceRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  // Beritahu listener lain di app
  window.dispatchEvent(new CustomEvent("maintproof:updated"));
}

export function getAllRecords(): MaintenanceRecord[] {
  // Non-mutating reverse — copy array dulu sebelum reverse
  return [...readAll()].reverse();
}

export function getRecordCount(): number {
  return readAll().length;
}

export function verifyRecord(fileHash: string): MaintenanceRecord | null {
  const all = readAll();
  const lower = fileHash.toLowerCase();
  return all.find((r) => r.fileHash.toLowerCase() === lower) ?? null;
}

export type RegisterInput = {
  fileHash: string;
  equipmentCode: string;
  maintenanceType: MaintenanceType;
  note: string;
  registeredBy: string;
};

export class DuplicateHashError extends Error {
  constructor() {
    super("Hash dokumen ini sudah pernah didaftarkan sebelumnya.");
  }
}

function randomTxHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

export async function registerRecord(input: RegisterInput): Promise<MaintenanceRecord> {
  // Simulasi delay konfirmasi blockchain
  await new Promise((r) => setTimeout(r, 1200));

  const all = readAll();
  if (all.some((r) => r.fileHash.toLowerCase() === input.fileHash.toLowerCase())) {
    throw new DuplicateHashError();
  }

  const record: MaintenanceRecord = {
    ...input,
    registeredAt: Math.floor(Date.now() / 1000),
    txHash: randomTxHash(),
  };

  writeAll([...all, record]);
  return record;
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

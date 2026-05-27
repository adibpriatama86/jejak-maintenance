/**
 * Registry MaintProof berbasis Solana "lite":
 * - Bukti registrasi disimpan ON-CHAIN sebagai memo transaction di Solana Devnet.
 * - Index ringan (signature + metadata) di-cache di localStorage agar UI bisa
 *   menampilkan riwayat tanpa harus scan getSignaturesForAddress untuk semua user.
 *   Sumber kebenaran tetap blockchain: tiap item bisa di-verifikasi di Solana Explorer.
 */
import type { MaintenanceType } from "@/data/equipment";

export type MaintenanceRecord = {
  fileHash: string; // 0x... SHA-256
  equipmentCode: string;
  equipmentName?: string;
  maintenanceType: MaintenanceType;
  note: string;
  registeredAt: number; // unix seconds
  registeredBy: string; // base58 wallet address
  signature: string; // Solana transaction signature
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
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent("maintproof:updated"));
}

export function getAllRecords(): MaintenanceRecord[] {
  // Terbaru duluan
  return [...readAll()].sort((a, b) => b.registeredAt - a.registeredAt);
}

export function getRecordCount(): number {
  return readAll().length;
}

export function verifyRecord(fileHash: string): MaintenanceRecord | null {
  const all = readAll();
  const lower = fileHash.toLowerCase();
  return all.find((r) => r.fileHash.toLowerCase() === lower) ?? null;
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

export function appendRecord(record: MaintenanceRecord) {
  const all = readAll();
  if (all.some((r) => r.signature === record.signature)) return;
  writeAll([...all, record]);
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

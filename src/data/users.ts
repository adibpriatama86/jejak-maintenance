/**
 * Helper untuk wallet (base58 Solana address).
 * MaintProof pakai wallet user langsung (Phantom) — tidak ada mapping user dummy.
 */
export type DummyUser = {
  name: string;
  role: "Teknisi" | "Supervisor" | "Admin";
  wallet: string;
};

export const DUMMY_USERS: DummyUser[] = [];

export function getUserByWallet(_address?: string | null): DummyUser | undefined {
  // Tidak ada direktori user — kembalikan undefined supaya UI fallback ke wallet address.
  return undefined;
}

export function shortAddress(address?: string | null) {
  if (!address) return "-";
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function shortHash(hash?: string | null) {
  if (!hash) return "-";
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

export function shortSig(sig?: string | null) {
  if (!sig) return "-";
  return `${sig.slice(0, 6)}…${sig.slice(-6)}`;
}

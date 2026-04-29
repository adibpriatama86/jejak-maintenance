export type DummyUser = {
  name: string;
  role: "Teknisi" | "Supervisor" | "Admin";
  wallet: string; // lowercase
};

export const DUMMY_USERS: DummyUser[] = [
  { name: "Teknisi Andi", role: "Teknisi", wallet: "0x1111111111111111111111111111111111111111" },
  { name: "Teknisi Budi", role: "Teknisi", wallet: "0x2222222222222222222222222222222222222222" },
  { name: "Supervisor Rina", role: "Supervisor", wallet: "0x3333333333333333333333333333333333333333" },
  { name: "Admin Maintenance", role: "Admin", wallet: "0x4444444444444444444444444444444444444444" },
];

export function getUserByWallet(address?: string | null): DummyUser | undefined {
  if (!address) return undefined;
  const lower = address.toLowerCase();
  return DUMMY_USERS.find((u) => u.wallet.toLowerCase() === lower);
}

export function shortAddress(address?: string | null) {
  if (!address) return "-";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortHash(hash?: string | null) {
  if (!hash) return "-";
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

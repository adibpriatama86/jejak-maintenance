import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

export function useWalletInfo() {
  const w = useWallet();
  const address = useMemo(() => w.publicKey?.toBase58() ?? null, [w.publicKey]);
  return {
    ...w,
    address,
    isConnected: !!w.connected && !!w.publicKey,
  };
}

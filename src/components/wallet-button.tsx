import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Wallet, LogOut, AlertTriangle } from "lucide-react";
import { shortAddress, getUserByWallet } from "@/data/users";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const user = getUserByWallet(address);
  const wrongNetwork = isConnected && chainId !== sepolia.id;

  const injectedConnector = connectors.find((c) => c.id === "injected") ?? connectors[0];

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => injectedConnector && connect({ connector: injectedConnector })}
          disabled={isPending || !injectedConnector}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50"
        >
          <Wallet className="h-4 w-4" />
          {isPending ? "Menghubungkan…" : "Hubungkan Wallet"}
        </button>
        {error && <span className="text-xs text-destructive">{error.message}</span>}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium shadow-soft hover:shadow-glow transition"
      >
        <span className="relative flex h-2 w-2">
          <span className={`absolute inset-0 rounded-full ${wrongNetwork ? "bg-warning" : "bg-success"} animate-ping opacity-60`} />
          <span className={`relative h-2 w-2 rounded-full ${wrongNetwork ? "bg-warning" : "bg-success"}`} />
        </span>
        <span className="hidden sm:inline">{user?.name ?? shortAddress(address)}</span>
        <span className="sm:hidden">{shortAddress(address)}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="glass absolute right-0 mt-2 w-64 rounded-2xl p-3 shadow-glow z-50"
          >
            <div className="px-2 py-2">
              <div className="text-xs text-muted-foreground">Terhubung sebagai</div>
              <div className="font-semibold">{user?.name ?? "Wallet tidak dikenal"}</div>
              {user && <div className="text-xs text-accent">{user.role}</div>}
              <div className="mt-1 truncate font-mono text-xs text-muted-foreground">{address}</div>
            </div>
            {wrongNetwork && (
              <button
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="mt-1 flex w-full items-center gap-2 rounded-xl bg-warning/15 px-3 py-2 text-left text-sm text-warning-foreground hover:bg-warning/25"
              >
                <AlertTriangle className="h-4 w-4" />
                Pindah ke Sepolia
              </button>
            )}
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Putuskan Wallet
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

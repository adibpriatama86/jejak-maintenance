import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet, LogOut, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { shortAddress } from "@/data/users";
import { explorerAddressUrl, NETWORK_LABEL } from "@/lib/solana";
import { toast } from "sonner";

export function WalletButton() {
  const { publicKey, connected, connecting, disconnect, select, connect, wallets } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const address = publicKey?.toBase58() ?? null;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleConnect() {
    const phantom = wallets.find((w) => w.adapter.name === "Phantom");
    if (!phantom) {
      toast.error("Phantom belum terpasang", {
        description: "Install ekstensi Phantom dari phantom.app lalu coba lagi.",
        action: {
          label: "Install Phantom",
          onClick: () => window.open("https://phantom.app/download", "_blank"),
        },
      });
      return;
    }
    if (phantom.readyState !== "Installed" && phantom.readyState !== "Loadable") {
      toast.error("Phantom tidak terdeteksi", {
        description: "Pastikan ekstensi Phantom aktif di browser kamu.",
      });
      return;
    }
    try {
      select(phantom.adapter.name);
      await connect();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menghubungkan wallet.";
      toast.error("Koneksi wallet gagal", { description: msg });
    }
  }

  if (!connected || !address) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50"
      >
        {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        {connecting ? "Menghubungkan…" : "Hubungkan Phantom"}
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium shadow-soft hover:shadow-glow transition"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
          <span className="relative h-2 w-2 rounded-full bg-success" />
        </span>
        <span>{shortAddress(address)}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="glass absolute right-0 mt-2 w-72 rounded-2xl p-3 shadow-glow z-50"
          >
            <div className="px-2 py-2">
              <div className="text-xs text-muted-foreground">Terhubung di {NETWORK_LABEL}</div>
              <div className="font-semibold">Phantom Wallet</div>
              <div className="mt-1 break-all font-mono text-xs text-muted-foreground">{address}</div>
            </div>
            <a
              href={explorerAddressUrl(address)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary"
            >
              <ExternalLink className="h-4 w-4" />
              Lihat di Solana Explorer
            </a>
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

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SOLANA_ENDPOINT } from "@/lib/solana";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // PhantomWalletAdapter sentuh window saat konstruksi → hanya di client.
  const wallets = useMemo(
    () => (mounted ? [new PhantomWalletAdapter()] : []),
    [mounted],
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
          <WalletProvider wallets={wallets} autoConnect>
            {children}
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useAccount, useChainId } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { useMemo } from "react";
import { getAllRecords } from "@/lib/registry";
import { EQUIPMENTS } from "@/data/equipment";
import { useRegistryVersion } from "@/hooks/use-registry";
import { motion } from "framer-motion";
import { FileText, Wrench, Activity, Network, Wallet, ArrowRight } from "lucide-react";
import { shortHash, getUserByWallet, shortAddress } from "@/data/users";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MaintProof" },
      { name: "description", content: "Ringkasan jumlah laporan, equipment, transaksi terbaru, dan status koneksi wallet di MaintProof." },
    ],
  }),
  component: DashboardPage,
});

function networkName(id?: number) {
  if (id === sepolia.id) return "Sepolia Testnet";
  if (id === mainnet.id) return "Ethereum Mainnet";
  if (!id) return "Belum terhubung";
  return `Chain #${id}`;
}

function DashboardPage() {
  useRegistryVersion();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const records = useMemo(() => getAllRecords(), []);
  const recent = records.slice(0, 5);
  const isMock = !import.meta.env.VITE_CONTRACT_ADDRESS;

  const stats = [
    { label: "Total Laporan", value: records.length, icon: FileText, accent: "primary" as const },
    { label: "Equipment Dummy", value: EQUIPMENTS.length, icon: Wrench, accent: "accent" as const },
    { label: "Transaksi Baru", value: recent.length, icon: Activity, accent: "primary" as const },
  ];

  return (
    <PageShell title="Dashboard" description="Ringkasan aktivitas pencatatan maintenance ke blockchain.">
      {isMock && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm"
        >
          <div className="mt-0.5 h-2 w-2 rounded-full bg-warning" />
          <div>
            <div className="font-semibold">Mode Simulasi Aktif</div>
            <p className="text-muted-foreground">
              Smart contract belum di-deploy. Data disimpan secara lokal di browser sebagai simulasi blockchain.
              Lihat README untuk cara deploy ke Sepolia.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <GlassCard className="hover:shadow-glow transition">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${s.accent === "primary" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}>
                  <s.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold">{s.value}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Network className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm text-muted-foreground">Network Aktif</div>
              <div className="font-semibold">{networkName(chainId)}</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent">
              <Wallet className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground">Status Wallet</div>
              {isConnected ? (
                <div className="font-semibold truncate">
                  Terhubung · {getUserByWallet(address)?.name ?? shortAddress(address)}
                </div>
              ) : (
                <div className="font-semibold text-muted-foreground">Belum terhubung</div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
          <Link to="/riwayat" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-muted-foreground">Belum ada laporan yang didaftarkan.</p>
            <Link to="/registrasi" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Daftarkan laporan pertama
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => {
              const user = getUserByWallet(r.registeredBy);
              return (
                <GlassCard key={r.fileHash} className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-semibold">{r.equipmentCode}</div>
                    <div className="text-xs text-muted-foreground">{r.maintenanceType} · oleh {user?.name ?? shortAddress(r.registeredBy)}</div>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{shortHash(r.fileHash)}</div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}

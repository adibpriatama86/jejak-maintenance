import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { getAllRecords } from "@/lib/registry";
import { EQUIPMENTS } from "@/data/equipment";
import { useRegistryVersion } from "@/hooks/use-registry";
import { motion } from "framer-motion";
import {
  FileText,
  Wrench,
  Activity,
  Network,
  Wallet,
  ArrowRight,
  ExternalLink,
  CircleDot,
  CalendarClock,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { shortAddress, shortHash, shortSig } from "@/data/users";
import { NETWORK_LABEL, explorerTxUrl } from "@/lib/solana";
import {
  MAINTENANCE_STATUSES,
  STATUS_LABEL_ID,
  STATUS_THEME,
  type MaintenanceStatus,
} from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MaintProof" },
      {
        name: "description",
        content:
          "Ringkasan registrasi, progres maintenance, dan koneksi Solana Devnet.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  useRegistryVersion();
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58() ?? null;
  const records = useMemo(() => getAllRecords(), []);
  const recent = records.slice(0, 5);
  const myCount = address
    ? records.filter((r) => r.registeredBy === address).length
    : 0;

  const statusCount = useMemo(() => {
    const init: Record<MaintenanceStatus, number> = {
      Scheduled: 0,
      "In Progress": 0,
      "Follow Up Required": 0,
      Completed: 0,
    };
    for (const r of records) init[r.status] = (init[r.status] ?? 0) + 1;
    return init;
  }, [records]);

  const statusCards: {
    status: MaintenanceStatus;
    icon: typeof FileText;
  }[] = [
    { status: "Scheduled", icon: CalendarClock },
    { status: "In Progress", icon: PlayCircle },
    { status: "Follow Up Required", icon: AlertTriangle },
    { status: "Completed", icon: CheckCircle2 },
  ];

  const stats = [
    {
      label: "Total Maintenance",
      value: records.length,
      icon: Activity,
      accent: "primary" as const,
    },
    {
      label: "Equipment Terdaftar",
      value: EQUIPMENTS.length,
      icon: Wrench,
      accent: "accent" as const,
    },
    {
      label: "Registrasi Saya",
      value: myCount,
      icon: FileText,
      accent: "primary" as const,
    },
  ];

  return (
    <PageShell
      title="Dashboard"
      description="Pantau aktivitas pencatatan laporan ke Solana Devnet secara real-time."
    >
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm"
      >
        <CircleDot className="mt-0.5 h-4 w-4 text-success" />
        <div>
          <div className="font-semibold">Connected to {NETWORK_LABEL}</div>
          <p className="text-muted-foreground">
            Semua registrasi dicatat sebagai memo transaction langsung ke
            Solana Devnet — bisa diverifikasi di Solana Explorer.
          </p>
        </div>
      </motion.div>

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
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl ${
                    s.accent === "primary"
                      ? "bg-primary/10 text-primary"
                      : "bg-accent/15 text-accent"
                  }`}
                >
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
              <div className="font-semibold">{NETWORK_LABEL}</div>
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
              {connected && address ? (
                <div className="font-mono text-sm font-semibold truncate">
                  {shortAddress(address)}
                </div>
              ) : (
                <div className="font-semibold text-muted-foreground">
                  Phantom belum terhubung
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
          <Link
            to="/riwayat"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-muted-foreground">
              Belum ada laporan yang didaftarkan ke Devnet.
            </p>
            <Link
              to="/registrasi"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Daftarkan laporan pertama
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <GlassCard
                key={r.signature}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold">
                    {r.equipmentName ?? r.equipmentCode}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.maintenanceType} · {shortAddress(r.registeredBy)}
                  </div>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {shortHash(r.fileHash)}
                </div>
                <a
                  href={explorerTxUrl(r.signature)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                  title={r.signature}
                >
                  <ExternalLink className="h-3 w-3" />
                  {shortSig(r.signature)}
                </a>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

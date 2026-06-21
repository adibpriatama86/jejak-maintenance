import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard, Skeleton } from "@/components/page-shell";
import { useEffect, useMemo, useState } from "react";
import { getAllRecords, type MaintenanceRecord } from "@/lib/registry";
import { useRegistryVersion } from "@/hooks/use-registry";
import { getEquipmentByCode } from "@/data/equipment";
import { shortAddress, shortHash, shortSig } from "@/data/users";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Inbox,
  Clock,
  AlertCircle,
  Globe2,
  UserRound,
  Wallet,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { explorerTxUrl } from "@/lib/solana";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";

export const Route = createFileRoute("/riwayat")({
  head: () => ({
    meta: [
      { title: "Riwayat Registrasi — MaintProof" },
      {
        name: "description",
        content:
          "Daftar transaksi memo Solana Devnet hasil registrasi laporan maintenance.",
      },
    ],
  }),
  component: RiwayatPage,
});

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: MaintenanceRecord[] }
  | { kind: "error"; message: string };

type Tab = "publik" | "saya";

function RiwayatPage() {
  const v = useRegistryVersion();
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58() ?? null;
  const [tab, setTab] = useState<Tab>("publik");
  const [state, setState] = useState<State>({ kind: "loading" });

  function load() {
    setState({ kind: "loading" });
    try {
      setTimeout(() => setState({ kind: "ready", data: getAllRecords() }), 250);
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Gagal memuat riwayat.",
      });
    }
  }

  useEffect(load, [v]);

  const filtered = useMemo(() => {
    if (state.kind !== "ready") return [];
    if (tab === "publik") return state.data;
    if (!address) return [];
    return state.data.filter((r) => r.registeredBy === address);
  }, [state, tab, address]);

  return (
    <PageShell
      title="Riwayat Registrasi"
      description="Semua transaksi memo MaintProof di Solana Devnet, terbaru di atas."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs tab={tab} onChange={setTab} />
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {state.kind === "ready" && (
              <>
                {filtered.length} laporan{tab === "saya" ? " saya" : ""}
              </>
            )}
          </div>
          <button
            onClick={load}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium hover:shadow-glow"
          >
            <RefreshCw
              className={`h-4 w-4 ${state.kind === "loading" ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {state.kind === "loading" && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassCard key={i}>
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-1/4" />
            </GlassCard>
          ))}
        </div>
      )}

      {state.kind === "error" && (
        <GlassCard className="flex items-start gap-3 border border-destructive/30">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <div className="font-semibold text-destructive">Gagal memuat data</div>
            <p className="text-sm text-muted-foreground">{state.message}</p>
          </div>
        </GlassCard>
      )}

      {state.kind === "ready" && (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "saya" && !connected ? (
              <GlassCard className="text-center py-16">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Wallet className="h-7 w-7" />
                </span>
                <div className="font-semibold">Phantom belum terhubung</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hubungkan Phantom di kanan atas untuk melihat riwayat
                  registrasimu.
                </p>
              </GlassCard>
            ) : filtered.length === 0 ? (
              <GlassCard className="text-center py-16">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Inbox className="h-7 w-7" />
                </span>
                <div className="font-semibold">
                  {tab === "publik" ? "Belum ada riwayat" : "Belum ada laporanmu"}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tab === "publik"
                    ? "Belum ada laporan yang dicatat ke Solana Devnet."
                    : "Wallet ini belum pernah mendaftarkan laporan."}
                </p>
                <Link
                  to="/registrasi"
                  className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Buat Registrasi
                </Link>
              </GlassCard>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.04 } },
                }}
                className="space-y-3"
              >
                {filtered.map((r) => (
                  <RecordRow key={r.signature} record={r} />
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </PageShell>
  );
}

function SegmentedTabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "publik", label: "Riwayat Publik", icon: <Globe2 className="h-4 w-4" /> },
    { id: "saya", label: "Riwayat Saya", icon: <UserRound className="h-4 w-4" /> },
  ];
  return (
    <div className="glass relative inline-flex rounded-full p-1">
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className="relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          >
            {active && (
              <motion.span
                layoutId="riwayat-tab-pill"
                className="absolute inset-0 -z-10 rounded-full bg-primary shadow-glow"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span
              className={active ? "text-primary-foreground" : "text-foreground/70"}
            >
              {it.icon}
            </span>
            <span
              className={active ? "text-primary-foreground" : "text-foreground/80"}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RecordRow({ record }: { record: MaintenanceRecord }) {
  const eq = useMemo(
    () => getEquipmentByCode(record.equipmentCode),
    [record.equipmentCode],
  );
  const date = new Date(record.registeredAt * 1000);
  const typeColor: Record<string, string> = {
    Preventive: "bg-primary/10 text-primary",
    Corrective: "bg-warning/15 text-warning-foreground",
    Inspection: "bg-accent/15 text-accent",
    Emergency: "bg-destructive/10 text-destructive",
  };
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      exit={{ opacity: 0 }}
    >
      <Link
        to="/riwayat/$signature"
        params={{ signature: record.signature }}
        className="block"
      >
        <GlassCard className="group hover:shadow-glow transition cursor-pointer">
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {eq?.name ?? record.equipmentName ?? "Equipment"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    typeColor[record.maintenanceType] ?? "bg-secondary"
                  }`}
                >
                  {record.maintenanceType}
                </span>
                <StatusBadge status={record.status} />
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {record.equipmentCode}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
                {record.note}
              </p>
              <ProgressBar status={record.status} size="sm" className="mt-3 max-w-xs" />
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono" title={record.registeredBy}>
                  {shortAddress(record.registeredBy)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {date.toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span>
                  Hash:{" "}
                  <span className="font-mono text-foreground">
                    {shortHash(record.fileHash)}
                  </span>
                </span>
                <span>
                  Tx:{" "}
                  <span className="font-mono text-foreground">
                    {shortSig(record.signature)}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <a
                href={explorerTxUrl(record.signature)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Explorer
              </a>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-70 transition group-hover:opacity-100">
                Detail <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

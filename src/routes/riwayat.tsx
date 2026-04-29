import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard, Skeleton } from "@/components/page-shell";
import { useEffect, useMemo, useState } from "react";
import { getAllRecords, type MaintenanceRecord } from "@/lib/registry";
import { useRegistryVersion } from "@/hooks/use-registry";
import { getEquipmentByCode } from "@/data/equipment";
import { getUserByWallet, shortAddress, shortHash } from "@/data/users";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Inbox, Clock, AlertCircle, Globe2, UserRound, Wallet } from "lucide-react";
import { useAccount } from "wagmi";

export const Route = createFileRoute("/riwayat")({
  head: () => ({
    meta: [
      { title: "Riwayat Registrasi — MaintProof" },
      { name: "description", content: "Lihat seluruh transaksi pendaftaran laporan maintenance terbaru di MaintProof." },
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
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("publik");
  const [state, setState] = useState<State>({ kind: "loading" });

  function load() {
    setState({ kind: "loading" });
    try {
      setTimeout(() => setState({ kind: "ready", data: getAllRecords() }), 300);
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Gagal memuat riwayat." });
    }
  }

  useEffect(load, [v]);

  const filtered = useMemo(() => {
    if (state.kind !== "ready") return [];
    if (tab === "publik") return state.data;
    if (!address) return [];
    const lower = address.toLowerCase();
    return state.data.filter((r) => r.registeredBy.toLowerCase() === lower);
  }, [state, tab, address]);

  return (
    <PageShell
      title="Riwayat Registrasi"
      description="Daftar laporan maintenance yang sudah dicatat ke blockchain, terbaru di atas."
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
            <RefreshCw className={`h-4 w-4 ${state.kind === "loading" ? "animate-spin" : ""}`} />
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
            {tab === "saya" && !isConnected ? (
              <GlassCard className="text-center py-16">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Wallet className="h-7 w-7" />
                </span>
                <div className="font-semibold">Wallet belum terhubung</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hubungkan wallet untuk melihat riwayat registrasi Anda.
                </p>
              </GlassCard>
            ) : filtered.length === 0 ? (
              <GlassCard className="text-center py-16">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Inbox className="h-7 w-7" />
                </span>
                <div className="font-semibold">
                  {tab === "publik" ? "Belum ada riwayat" : "Belum ada laporan Anda"}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tab === "publik"
                    ? "Belum ada riwayat registrasi."
                    : "Belum ada laporan yang Anda daftarkan dari wallet ini."}
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
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                className="space-y-3"
              >
                {filtered.map((r) => (
                  <RecordRow key={r.fileHash} record={r} />
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
            style={{ color: active ? "hsl(var(--primary-foreground))" : undefined }}
          >
            {active && (
              <motion.span
                layoutId="riwayat-tab-pill"
                className="absolute inset-0 -z-10 rounded-full bg-primary shadow-glow"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className={active ? "text-primary-foreground" : "text-foreground/70"}>{it.icon}</span>
            <span className={active ? "text-primary-foreground" : "text-foreground/80"}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function RecordRow({ record }: { record: MaintenanceRecord }) {
  const eq = useMemo(() => getEquipmentByCode(record.equipmentCode), [record.equipmentCode]);
  const user = getUserByWallet(record.registeredBy);
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
      <GlassCard className="hover:shadow-glow transition">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{eq?.name ?? "Equipment tidak dikenal"}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor[record.maintenanceType] ?? "bg-secondary"}`}>
                {record.maintenanceType}
              </span>
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{record.equipmentCode}</div>
            <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{record.note}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Oleh <span className="font-medium text-foreground">{user?.name ?? shortAddress(record.registeredBy)}</span>
                {user && <span className="ml-1 text-accent">· {user.role}</span>}
              </span>
              <span className="font-mono" title={record.registeredBy}>{shortAddress(record.registeredBy)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Hash</div>
            <div className="font-mono text-xs">{shortHash(record.fileHash)}</div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

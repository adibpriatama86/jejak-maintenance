import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard, Skeleton } from "@/components/page-shell";
import { useEffect, useState, useMemo } from "react";
import { getAllRecords, type MaintenanceRecord } from "@/lib/registry";
import { useRegistryVersion } from "@/hooks/use-registry";
import { getEquipmentByCode } from "@/data/equipment";
import { getUserByWallet, shortAddress, shortHash } from "@/data/users";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Inbox, Clock, AlertCircle } from "lucide-react";

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

function RiwayatPage() {
  const v = useRegistryVersion();
  const [state, setState] = useState<State>({ kind: "loading" });

  function load() {
    setState({ kind: "loading" });
    try {
      // Non-mutating: getAllRecords sudah mengembalikan copy yang sudah di-reverse
      setTimeout(() => setState({ kind: "ready", data: getAllRecords() }), 350);
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Gagal memuat riwayat." });
    }
  }

  useEffect(load, [v]);

  return (
    <PageShell
      title="Riwayat Registrasi"
      description="Daftar laporan maintenance yang sudah dicatat ke blockchain, terbaru di atas."
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {state.kind === "ready" && <>{state.data.length} laporan terdaftar</>}
        </div>
        <button
          onClick={load}
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium hover:shadow-glow"
        >
          <RefreshCw className={`h-4 w-4 ${state.kind === "loading" ? "animate-spin" : ""}`} />
          Refresh
        </button>
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

      {state.kind === "ready" && state.data.length === 0 && (
        <GlassCard className="text-center py-16">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Inbox className="h-7 w-7" />
          </span>
          <div className="font-semibold">Belum ada riwayat</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftarkan laporan maintenance pertama untuk melihatnya di sini.
          </p>
          <Link to="/registrasi" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            Buat Registrasi
          </Link>
        </GlassCard>
      )}

      {state.kind === "ready" && state.data.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          className="space-y-3"
        >
          <AnimatePresence>
            {state.data.map((r) => <RecordRow key={r.fileHash} record={r} />)}
          </AnimatePresence>
        </motion.div>
      )}
    </PageShell>
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
              <span className="font-mono">{shortAddress(record.registeredBy)}</span>
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

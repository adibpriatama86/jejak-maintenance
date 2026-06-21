import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useEffect, useMemo, useState } from "react";
import {
  getRecordBySignature,
  updateRecordStatus,
  type MaintenanceRecord,
} from "@/lib/registry";
import { useRegistryVersion } from "@/hooks/use-registry";
import { getEquipmentByCode } from "@/data/equipment";
import { shortAddress } from "@/data/users";
import {
  MAINTENANCE_STATUSES,
  STATUS_LABEL_ID,
  STATUS_THEME,
  describeEvent,
  type MaintenanceStatus,
} from "@/lib/status";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { explorerTxUrl } from "@/lib/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  Wrench,
  Hash,
  Wallet,
  Tag,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/riwayat/$signature")({
  head: () => ({
    meta: [
      { title: "Detail Maintenance — MaintProof" },
      {
        name: "description",
        content:
          "Detail laporan maintenance: status, progress, dan timeline aktivitas on-chain.",
      },
    ],
  }),
  component: DetailPage,
});

function DetailPage() {
  const { signature } = Route.useParams();
  const v = useRegistryVersion();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58() ?? null;

  const record = useMemo(
    () => getRecordBySignature(signature),
    // re-baca tiap registry berubah
    [signature, v],
  );

  if (!record) {
    return (
      <PageShell title="Detail Maintenance">
        <GlassCard className="text-center py-16">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-warning/15 text-warning">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <div className="font-semibold">Laporan tidak ditemukan</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Signature ini belum tercatat di registry lokal.
          </p>
          <button
            onClick={() => navigate({ to: "/riwayat" })}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Riwayat
          </button>
        </GlassCard>
      </PageShell>
    );
  }

  return <DetailContent record={record} viewerAddress={connected ? address : null} />;
}

function DetailContent({
  record,
  viewerAddress,
}: {
  record: MaintenanceRecord;
  viewerAddress: string | null;
}) {
  const eq = getEquipmentByCode(record.equipmentCode);
  const eqName = eq?.name ?? record.equipmentName ?? "Equipment";
  const date = new Date(record.registeredAt * 1000);
  const sortedEvents = useMemo(
    () => [...record.events].sort((a, b) => b.ts - a.ts),
    [record.events],
  );
  const theme = STATUS_THEME[record.status];

  function onChangeStatus(next: MaintenanceStatus) {
    if (!viewerAddress) {
      toast.error("Hubungkan Phantom dulu", {
        description: "Perubahan status perlu identitas wallet yang aktif.",
      });
      return;
    }
    if (next === record.status) return;
    const updated = updateRecordStatus(record.signature, next, viewerAddress);
    if (updated) {
      toast.success("Status diperbarui", {
        description: `Sekarang: ${STATUS_LABEL_ID[next]}`,
      });
    }
  }

  return (
    <PageShell title="Detail Maintenance" description={eqName}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/riwayat"
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium hover:shadow-glow"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Riwayat
        </Link>
        <a
          href={explorerTxUrl(record.signature)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
        >
          <ExternalLink className="h-4 w-4" />
          Lihat Transaksi di Solana Explorer
        </a>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {/* Status + progress */}
          <GlassCard className={`ring-1 ${theme.ring}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status saat ini
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={record.status} />
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                    {record.maintenanceType}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Progres</div>
                <div className="text-2xl font-bold">
                  {STATUS_THEME[record.status] && (
                    <ProgressValue status={record.status} />
                  )}
                </div>
              </div>
            </div>
            <ProgressBar status={record.status} className="mt-4" />

            <div className="mt-5">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Perbarui status
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MAINTENANCE_STATUSES.map((s) => {
                  const active = s === record.status;
                  return (
                    <button
                      key={s}
                      onClick={() => onChangeStatus(s)}
                      disabled={!viewerAddress}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-glow"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      {STATUS_LABEL_ID[s]}
                    </button>
                  );
                })}
              </div>
              {!viewerAddress && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Hubungkan Phantom untuk mengubah status.
                </p>
              )}
            </div>
          </GlassCard>

          {/* Detail metadata */}
          <GlassCard>
            <h2 className="mb-4 text-base font-semibold">Informasi Laporan</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info icon={<Wrench className="h-4 w-4" />} label="Equipment" value={eqName} />
              <Info
                icon={<Tag className="h-4 w-4" />}
                label="Kode Equipment"
                value={record.equipmentCode}
                mono
              />
              <Info
                icon={<Tag className="h-4 w-4" />}
                label="Jenis Maintenance"
                value={record.maintenanceType}
              />
              <Info
                icon={<Clock className="h-4 w-4" />}
                label="Didaftarkan pada"
                value={date.toLocaleString("id-ID", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              />
              <Info
                icon={<Wallet className="h-4 w-4" />}
                label="Wallet Pengguna"
                value={shortAddress(record.registeredBy)}
                title={record.registeredBy}
                mono
                copy={record.registeredBy}
              />
              <Info
                icon={<Hash className="h-4 w-4" />}
                label="Signature Solana"
                value={`${record.signature.slice(0, 14)}…${record.signature.slice(-10)}`}
                title={record.signature}
                mono
                copy={record.signature}
              />
              <div className="sm:col-span-2">
                <Info
                  icon={<Hash className="h-4 w-4" />}
                  label="Hash Dokumen (SHA-256)"
                  value={record.fileHash}
                  mono
                  copy={record.fileHash}
                  breakAll
                />
              </div>
              <div className="sm:col-span-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Catatan
                </div>
                <p className="rounded-xl bg-secondary/60 p-3 text-sm">
                  {record.note}
                </p>
              </div>
            </dl>
          </GlassCard>
        </div>

        {/* Timeline */}
        <GlassCard>
          <h2 className="mb-4 text-base font-semibold">Timeline Aktivitas</h2>
          <ol className="relative space-y-5 border-l border-border/70 pl-5">
            {sortedEvents.map((ev, i) => {
              const t = new Date(ev.ts * 1000);
              const dotTheme =
                ev.kind === "status_changed" && ev.to
                  ? STATUS_THEME[ev.to].dot
                  : ev.kind === "created"
                    ? "bg-accent"
                    : "bg-primary";
              return (
                <motion.li
                  key={ev.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <span
                    className={`absolute -left-[27px] top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full ring-4 ring-background ${dotTheme}`}
                  />
                  <div className="text-xs text-muted-foreground">
                    {t.toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </div>
                  <div className="mt-0.5 text-sm font-medium">
                    {describeEvent(ev)}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    oleh {shortAddress(ev.actor)}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </GlassCard>
      </div>
    </PageShell>
  );
}

function ProgressValue({ status }: { status: MaintenanceStatus }) {
  // Import statis biar tidak siklik
  const pct = ({ Scheduled: 25, "In Progress": 50, "Follow Up Required": 75, Completed: 100 } as const)[
    status
  ];
  return <span>{pct}%</span>;
}

function Info({
  icon,
  label,
  value,
  mono,
  title,
  copy,
  breakAll,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  title?: string;
  copy?: string;
  breakAll?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div
          title={title}
          className={`text-sm ${mono ? "font-mono" : "font-medium"} ${breakAll ? "break-all" : ""}`}
        >
          {value}
        </div>
        {copy && (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(copy);
              setCopied(true);
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Salin"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

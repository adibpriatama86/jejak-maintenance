/**
 * Lapisan status & progress untuk MaintProof.
 * Data status disimpan off-chain (localStorage) — sumber kebenaran integritas
 * dokumen tetap dari hash + signature Solana Devnet yang sudah on-chain.
 */
export const MAINTENANCE_STATUSES = [
  "Scheduled",
  "In Progress",
  "Follow Up Required",
  "Completed",
] as const;

export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

/** Persentase progress per status. */
export const STATUS_PROGRESS: Record<MaintenanceStatus, number> = {
  Scheduled: 25,
  "In Progress": 50,
  "Follow Up Required": 75,
  Completed: 100,
};

export const STATUS_LABEL_ID: Record<MaintenanceStatus, string> = {
  Scheduled: "Terjadwal",
  "In Progress": "Sedang Dikerjakan",
  "Follow Up Required": "Perlu Tindak Lanjut",
  Completed: "Selesai",
};

/** Token warna Tailwind per status — mengikuti palet design system. */
export const STATUS_THEME: Record<
  MaintenanceStatus,
  { dot: string; chip: string; bar: string; ring: string }
> = {
  Scheduled: {
    dot: "bg-muted-foreground",
    chip: "bg-secondary text-foreground/80",
    bar: "bg-muted-foreground",
    ring: "ring-border",
  },
  "In Progress": {
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary",
    bar: "bg-primary",
    ring: "ring-primary/30",
  },
  "Follow Up Required": {
    dot: "bg-warning",
    chip: "bg-warning/15 text-warning-foreground",
    bar: "bg-warning",
    ring: "ring-warning/30",
  },
  Completed: {
    dot: "bg-success",
    chip: "bg-success/15 text-success",
    bar: "bg-success",
    ring: "ring-success/30",
  },
};

export type TimelineEventKind =
  | "created"
  | "status_changed"
  | "document_uploaded";

export type TimelineEvent = {
  id: string;
  kind: TimelineEventKind;
  ts: number; // unix seconds
  actor: string; // wallet address
  from?: MaintenanceStatus;
  to?: MaintenanceStatus;
  note?: string;
};

export function describeEvent(ev: TimelineEvent): string {
  switch (ev.kind) {
    case "created":
      return "Laporan maintenance dibuat";
    case "document_uploaded":
      return "Dokumen maintenance diunggah ke blockchain";
    case "status_changed":
      return `Status diubah dari "${STATUS_LABEL_ID[ev.from ?? "Scheduled"]}" menjadi "${STATUS_LABEL_ID[ev.to ?? "Scheduled"]}"`;
  }
}

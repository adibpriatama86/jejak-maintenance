import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useState } from "react";
import { sha256File, isValidHash, formatBytes } from "@/lib/hash";
import { verifyRecord, type MaintenanceRecord } from "@/lib/registry";
import { getEquipmentByCode } from "@/data/equipment";
import { getUserByWallet, shortAddress } from "@/data/users";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, UploadCloud, Hash, Loader2, FileText, User2, Calendar, Wrench, FileSignature } from "lucide-react";

export const Route = createFileRoute("/verifikasi")({
  head: () => ({
    meta: [
      { title: "Verifikasi Dokumen — MaintProof" },
      { name: "description", content: "Cek apakah dokumen maintenance Anda masih sama dengan yang pernah dicatat di blockchain." },
    ],
  }),
  component: VerifikasiPage,
});

type Mode = "file" | "hash";
type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; record: MaintenanceRecord }
  | { kind: "notfound"; hash: string }
  | { kind: "error"; message: string };

function VerifikasiPage() {
  const [mode, setMode] = useState<Mode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState("");
  const [result, setResult] = useState<Result>({ kind: "idle" });

  async function verify(target: string) {
    setResult({ kind: "loading" });
    await new Promise((r) => setTimeout(r, 400));
    try {
      const found = verifyRecord(target);
      if (found) setResult({ kind: "found", record: found });
      else setResult({ kind: "notfound", hash: target });
    } catch (e) {
      setResult({ kind: "error", message: e instanceof Error ? e.message : "Gagal melakukan verifikasi." });
    }
  }

  async function onFile(f: File | null) {
    setFile(f);
    setResult({ kind: "idle" });
    if (!f) return;
    setResult({ kind: "loading" });
    try {
      const h = await sha256File(f);
      setHash(h);
      await verify(h);
    } catch {
      setResult({ kind: "error", message: "Gagal menghitung hash file." });
    }
  }

  function onSubmitHash(e: React.FormEvent) {
    e.preventDefault();
    const v = hash.trim();
    if (!isValidHash(v)) {
      setResult({ kind: "error", message: "Format hash tidak valid. Harus 0x diikuti 64 karakter hex." });
      return;
    }
    verify(v);
  }

  return (
    <PageShell
      title="Verifikasi Dokumen"
      description="Bandingkan sidik jari dokumen Anda dengan yang tercatat di blockchain."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <div className="mb-4 inline-flex rounded-full bg-secondary p-1 text-sm">
            <ModeBtn active={mode === "file"} onClick={() => setMode("file")}>Upload File</ModeBtn>
            <ModeBtn active={mode === "hash"} onClick={() => setMode("hash")}>Input Hash</ModeBtn>
          </div>

          {mode === "file" ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition hover:border-primary/40">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">{file ? file.name : "Pilih file untuk diverifikasi"}</div>
              <div className="text-xs text-muted-foreground">
                {file ? formatBytes(file.size) : "Hash dihitung lokal di browser"}
              </div>
              <input type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            </label>
          ) : (
            <form onSubmit={onSubmitHash} className="space-y-3">
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-xl border border-input bg-background/60 py-2.5 pl-10 pr-3 font-mono text-sm outline-none ring-primary/30 focus:ring-2"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
              >
                Verifikasi Hash
              </button>
            </form>
          )}

          {hash && mode === "file" && (
            <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-xs">
              <div className="mb-1 font-medium">Hash dokumen:</div>
              <div className="break-all font-mono text-muted-foreground">{hash}</div>
            </div>
          )}
        </GlassCard>

        <div>
          <AnimatePresence mode="wait">
            {result.kind === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="text-center text-sm text-muted-foreground py-12">
                  Hasil verifikasi akan tampil di sini.
                </GlassCard>
              </motion.div>
            )}
            {result.kind === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Sedang memverifikasi…
                </GlassCard>
              </motion.div>
            )}
            {result.kind === "found" && (
              <motion.div key="found" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <FoundCard record={result.record} />
              </motion.div>
            )}
            {result.kind === "notfound" && (
              <motion.div key="nf" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GlassCard className="border border-destructive/30">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                      <ShieldAlert className="h-6 w-6" />
                    </span>
                    <div>
                      <div className="font-semibold text-destructive">Tidak Terverifikasi</div>
                      <p className="text-sm text-muted-foreground">
                        Hash ini belum pernah didaftarkan, atau dokumen sudah berubah dari versi aslinya.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
            {result.kind === "error" && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="border border-destructive/30 text-sm text-destructive">{result.message}</GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 font-medium transition ${
        active ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function FoundCard({ record }: { record: MaintenanceRecord }) {
  const eq = getEquipmentByCode(record.equipmentCode);
  const user = getUserByWallet(record.registeredBy);
  const date = new Date(record.registeredAt * 1000);
  return (
    <GlassCard>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success/15 text-success">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <div className="font-semibold text-success">Dokumen Terverifikasi</div>
          <p className="text-xs text-muted-foreground">Hash ini cocok dengan catatan di blockchain.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <Row icon={Wrench} label="Equipment">
          <div className="font-semibold">{eq?.name ?? "Equipment tidak dikenal"}</div>
          <div className="font-mono text-xs text-muted-foreground">{record.equipmentCode}</div>
        </Row>
        <Row icon={FileText} label="Jenis Maintenance">{record.maintenanceType}</Row>
        <Row icon={FileSignature} label="Catatan">
          <p className="text-foreground/90">{record.note}</p>
        </Row>
        <Row icon={User2} label="Didaftarkan oleh">
          <div className="font-semibold">{user?.name ?? "Wallet tidak dikenal"}</div>
          <div className="text-xs text-muted-foreground">
            {user ? <span className="text-accent">{user.role}</span> : "Tanpa role"} · {shortAddress(record.registeredBy)}
          </div>
        </Row>
        <Row icon={Calendar} label="Waktu Pendaftaran">
          {date.toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}
        </Row>
      </div>
    </GlassCard>
  );
}

function Row({
  icon: Icon, label, children,
}: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-secondary/40 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

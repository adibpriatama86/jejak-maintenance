import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useEffect, useMemo, useState } from "react";
import {
  AREAS,
  BAGIAN_BY_AREA,
  EQUIPMENTS,
  MAINTENANCE_TYPES,
  type MaintenanceType,
  getEquipmentsBy,
  getEquipmentByCode,
} from "@/data/equipment";
import { sha256File, formatBytes } from "@/lib/hash";
import { registerRecord, DuplicateHashError } from "@/lib/registry";
import { useAccount, useConnect } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileCheck2, CheckCircle2, AlertCircle, Loader2, Wallet } from "lucide-react";
import { shortHash } from "@/data/users";

export const Route = createFileRoute("/registrasi")({
  head: () => ({
    meta: [
      { title: "Registrasi Laporan — MaintProof" },
      { name: "description", content: "Daftarkan hash laporan maintenance equipment ke blockchain dengan beberapa langkah sederhana." },
    ],
  }),
  component: RegistrasiPage,
});

type Status =
  | { kind: "idle" }
  | { kind: "hashing" }
  | { kind: "submitting" }
  | { kind: "success"; txHash: string; fileHash: string }
  | { kind: "error"; message: string };

function RegistrasiPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const [area, setArea] = useState("");
  const [bagian, setBagian] = useState("");
  const [equipmentCode, setEquipmentCode] = useState("");
  const [type, setType] = useState<MaintenanceType>("Preventive");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const bagianOpts = area ? BAGIAN_BY_AREA[area] ?? [] : [];
  const equipmentOpts = useMemo(
    () => (area && bagian ? getEquipmentsBy(area, bagian) : []),
    [area, bagian],
  );
  const equipment = getEquipmentByCode(equipmentCode);

  // Reset cascade
  useEffect(() => { setBagian(""); setEquipmentCode(""); }, [area]);
  useEffect(() => { setEquipmentCode(""); }, [bagian]);

  async function onPickFile(f: File | null) {
    setFile(f);
    setFileHash("");
    if (!f) return;
    setStatus({ kind: "hashing" });
    try {
      const h = await sha256File(f);
      setFileHash(h);
      setStatus({ kind: "idle" });
    } catch {
      setStatus({ kind: "error", message: "Gagal menghitung hash file." });
    }
  }

  const canSubmit =
    isConnected && area && bagian && equipmentCode && type && note.trim().length > 0 && fileHash && status.kind !== "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !address) return;
    setStatus({ kind: "submitting" });
    try {
      const rec = await registerRecord({
        fileHash,
        equipmentCode,
        maintenanceType: type,
        note: note.trim(),
        registeredBy: address,
      });
      setStatus({ kind: "success", txHash: rec.txHash, fileHash: rec.fileHash });
    } catch (err) {
      const msg = err instanceof DuplicateHashError
        ? err.message
        : err instanceof Error ? err.message : "Transaksi gagal.";
      setStatus({ kind: "error", message: msg });
    }
  }

  function resetForm() {
    setFile(null); setFileHash(""); setNote(""); setStatus({ kind: "idle" });
  }

  return (
    <PageShell
      title="Registrasi Laporan"
      description="Pilih equipment, unggah dokumen bukti, lalu catat hash-nya ke blockchain."
    >
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <GlassCard className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area" required>
              <Select value={area} onChange={setArea} placeholder="Pilih area">
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </Field>
            <Field label="Bagian" required hint={!area ? "Pilih area terlebih dahulu" : undefined}>
              <Select value={bagian} onChange={setBagian} disabled={!area} placeholder="Pilih bagian">
                {bagianOpts.map((b) => <option key={b} value={b}>{b}</option>)}
              </Select>
            </Field>
          </div>

          <Field label="Equipment" required hint={!bagian ? "Pilih bagian terlebih dahulu" : undefined}>
            <Select value={equipmentCode} onChange={setEquipmentCode} disabled={!bagian} placeholder="Pilih equipment">
              {equipmentOpts.map((e) => (
                <option key={e.code} value={e.code}>{e.code} — {e.name}</option>
              ))}
            </Select>
          </Field>

          {equipment && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-primary/5 ring-1 ring-primary/20 p-3 text-sm"
            >
              <div className="text-xs text-muted-foreground">Equipment Terpilih</div>
              <div className="font-semibold">{equipment.name}</div>
              <div className="font-mono text-xs text-primary">{equipment.code}</div>
            </motion.div>
          )}

          <Field label="Jenis Maintenance" required>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MAINTENANCE_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    type === t
                      ? "border-primary bg-primary/10 text-primary shadow-soft"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Catatan Singkat" required>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 280))}
              placeholder="Misal: Penggantian belt conveyor sesuai jadwal preventive bulan ini."
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none ring-primary/30 focus:ring-2"
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">{note.length}/280</div>
          </Field>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <Field label="File Bukti" required hint="PDF, JPG, atau PNG · maksimum ~20MB">
              <FileDrop file={file} onPick={onPickFile} />
            </Field>

            <AnimatePresence>
              {status.kind === "hashing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Menghitung hash SHA-256…
                </motion.div>
              )}
              {fileHash && file && status.kind !== "hashing" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 space-y-2 rounded-xl bg-success/10 p-3 text-sm ring-1 ring-success/30"
                >
                  <div className="flex items-center gap-2 font-medium text-success-foreground">
                    <FileCheck2 className="h-4 w-4 text-success" /> Hash siap
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="truncate">📄 {file.name} · {formatBytes(file.size)}</div>
                    <div className="mt-1 break-all font-mono">{fileHash}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          <GlassCard>
            {!isConnected ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Wallet className="h-4 w-4 text-primary" /> Wallet diperlukan
                </div>
                <p className="text-muted-foreground">Hubungkan wallet untuk menandatangani transaksi pendaftaran.</p>
                <button
                  type="button"
                  onClick={() => connectors[0] && connect({ connector: connectors[0] })}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Hubungkan Wallet
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status.kind === "submitting" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim transaksi…</>
                ) : (
                  <>Daftarkan ke Blockchain</>
                )}
              </button>
            )}

            <AnimatePresence>
              {status.kind === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-xl bg-success/10 p-4 ring-1 ring-success/30"
                >
                  <div className="flex items-center gap-2 font-semibold text-success-foreground">
                    <CheckCircle2 className="h-5 w-5 text-success" /> Berhasil dicatat!
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>Tx Hash: <span className="font-mono text-foreground">{shortHash(status.txHash)}</span></div>
                    <div>File Hash: <span className="font-mono text-foreground">{shortHash(status.fileHash)}</span></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={resetForm} className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary">
                      Daftar Lagi
                    </button>
                    <Link to="/riwayat" className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground">
                      Lihat Riwayat
                    </Link>
                  </div>
                </motion.div>
              )}
              {status.kind === "error" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm ring-1 ring-destructive/30"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  <span>{status.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </form>
    </PageShell>
  );
}

function Field({
  label, children, required, hint,
}: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Select({
  value, onChange, children, disabled, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2 disabled:opacity-50"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function FileDrop({ file, onPick }: { file: File | null; onPick: (f: File | null) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files?.[0]; if (f) onPick(f);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
        drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      <UploadCloud className="h-7 w-7 text-muted-foreground" />
      <div className="text-sm font-medium">
        {file ? file.name : "Tarik file ke sini atau klik untuk memilih"}
      </div>
      <div className="text-xs text-muted-foreground">
        {file ? formatBytes(file.size) : "PDF, JPG, atau PNG"}
      </div>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useEffect, useMemo, useState } from "react";
import {
  AREAS,
  BAGIAN_BY_AREA,
  MAINTENANCE_TYPES,
  type MaintenanceType,
  getEquipmentsBy,
  getEquipmentByCode,
} from "@/data/equipment";
import { sha256File, formatBytes } from "@/lib/hash";
import {
  appendRecord,
  buildMemoPayload,
  hasHash,
  DuplicateHashError,
} from "@/lib/registry";
import {
  buildMemoTransaction,
  explorerTxUrl,
  getConnection,
  NETWORK_LABEL,
} from "@/lib/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { shortHash } from "@/data/users";
import { toast } from "sonner";

export const Route = createFileRoute("/registrasi")({
  head: () => ({
    meta: [
      { title: "Registrasi Laporan — MaintProof" },
      {
        name: "description",
        content:
          "Daftarkan hash laporan maintenance ke Solana Devnet lewat memo transaction.",
      },
    ],
  }),
  component: RegistrasiPage,
});

type Status =
  | { kind: "idle" }
  | { kind: "hashing" }
  | { kind: "submitting"; step: string }
  | { kind: "success"; signature: string; fileHash: string }
  | { kind: "error"; message: string };

function RegistrasiPage() {
  const wallet = useWallet();
  const connected = wallet.connected && !!wallet.publicKey;

  const [area, setArea] = useState("");
  const [bagian, setBagian] = useState("");
  const [equipmentCode, setEquipmentCode] = useState("");
  const [type, setType] = useState<MaintenanceType>("Preventive");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const bagianOpts = area ? (BAGIAN_BY_AREA[area] ?? []) : [];
  const equipmentOpts = useMemo(
    () => (area && bagian ? getEquipmentsBy(area, bagian) : []),
    [area, bagian],
  );
  const equipment = getEquipmentByCode(equipmentCode);

  useEffect(() => {
    setBagian("");
    setEquipmentCode("");
  }, [area]);
  useEffect(() => {
    setEquipmentCode("");
  }, [bagian]);

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
    connected &&
    area &&
    bagian &&
    equipmentCode &&
    type &&
    note.trim().length > 0 &&
    fileHash &&
    status.kind !== "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !wallet.publicKey || !wallet.signTransaction) return;

    if (hasHash(fileHash)) {
      setStatus({
        kind: "error",
        message: new DuplicateHashError().message,
      });
      return;
    }

    try {
      setStatus({ kind: "submitting", step: "Menyiapkan transaksi…" });

      const payload = buildMemoPayload({
        fileHash,
        equipmentCode,
        equipmentName: equipment?.name,
        maintenanceType: type,
        note: note.trim(),
      });

      const { tx, blockhash, lastValidBlockHeight } = await buildMemoTransaction(
        JSON.stringify(payload),
        wallet.publicKey,
      );

      setStatus({ kind: "submitting", step: "Menunggu persetujuan Phantom…" });
      const signed = await wallet.signTransaction(tx);

      setStatus({ kind: "submitting", step: "Mengirim ke Solana Devnet…" });
      const connection = getConnection();
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
      });

      setStatus({ kind: "submitting", step: "Menunggu konfirmasi blockchain…" });
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      appendRecord({
        fileHash,
        equipmentCode,
        equipmentName: equipment?.name,
        maintenanceType: type,
        note: note.trim(),
        registeredAt: payload.ts,
        registeredBy: wallet.publicKey.toBase58(),
        signature,
      });

      setStatus({ kind: "success", signature, fileHash });
      toast.success("Laporan tercatat di Solana Devnet", {
        description: "Transaksi memo berhasil dikonfirmasi.",
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      let friendly = raw;
      if (/User rejected|rejected the request/i.test(raw))
        friendly = "Transaksi dibatalkan dari Phantom.";
      else if (/insufficient|0x1\b|InsufficientFunds/i.test(raw))
        friendly =
          "Saldo SOL tidak cukup untuk membayar fee. Top up dulu lewat faucet Devnet.";
      else if (/blockhash/i.test(raw))
        friendly = "Blockhash kadaluarsa, coba kirim ulang.";
      setStatus({ kind: "error", message: friendly });
      toast.error("Transaksi gagal", { description: friendly });
    }
  }

  function resetForm() {
    setFile(null);
    setFileHash("");
    setNote("");
    setStatus({ kind: "idle" });
  }

  return (
    <PageShell
      title="Registrasi Laporan"
      description={`Catat sidik jari laporan maintenance ke ${NETWORK_LABEL} lewat memo transaction.`}
    >
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <GlassCard className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area" required>
              <Select value={area} onChange={setArea} placeholder="Pilih area">
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Bagian"
              required
              hint={!area ? "Pilih area dulu" : undefined}
            >
              <Select
                value={bagian}
                onChange={setBagian}
                disabled={!area}
                placeholder="Pilih bagian"
              >
                {bagianOpts.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Equipment"
            required
            hint={!bagian ? "Pilih bagian dulu" : undefined}
          >
            <Select
              value={equipmentCode}
              onChange={setEquipmentCode}
              disabled={!bagian}
              placeholder="Pilih equipment"
            >
              {equipmentOpts.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.code} — {e.name}
                </option>
              ))}
            </Select>
          </Field>

          {equipment && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-primary/5 ring-1 ring-primary/20 p-3 text-sm"
            >
              <div className="text-xs text-muted-foreground">Equipment terpilih</div>
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
                      ? "border-primary bg-primary/10 text-primary shadow-glow"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Catatan / Deskripsi" required>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Tulis ringkasan pekerjaan: apa yang dikerjakan, temuan, atau hasil inspeksi…"
              className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </Field>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <FileDrop file={file} onPick={onPickFile} />
            <AnimatePresence>
              {status.kind === "hashing" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghitung SHA-256…
                </motion.div>
              )}
              {fileHash && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl bg-secondary/60 p-3 text-xs"
                >
                  <div className="mb-1 font-medium">Hash file:</div>
                  <div className="break-all font-mono text-muted-foreground">
                    {fileHash}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          <GlassCard>
            {!connected ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Wallet className="h-4 w-4 text-primary" /> Wallet diperlukan
                </div>
                <p className="text-muted-foreground">
                  Hubungkan Phantom di pojok kanan atas untuk menandatangani
                  transaksi memo.
                </p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status.kind === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {status.step}
                  </>
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
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-success">Berhasil tercatat di blockchain!</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>
                      Signature:{" "}
                      <span className="font-mono text-foreground">
                        {shortHash(status.signature)}
                      </span>
                    </div>
                    <div>
                      Hash file:{" "}
                      <span className="font-mono text-foreground">
                        {shortHash(status.fileHash)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <a
                      href={explorerTxUrl(status.signature)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Solana Explorer
                    </a>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
                    >
                      Daftar lagi
                    </button>
                    <Link
                      to="/riwayat"
                      className="rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground"
                    >
                      Lihat riwayat
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
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
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
  value,
  onChange,
  children,
  disabled,
  placeholder,
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

function FileDrop({
  file,
  onPick,
}: {
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onPick(f);
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

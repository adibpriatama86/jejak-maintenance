import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { motion } from "framer-motion";
import { Fingerprint, GitCommit, Database, Lock, FileText } from "lucide-react";

export const Route = createFileRoute("/edukasi")({
  head: () => ({
    meta: [
      { title: "Edukasi — MaintProof" },
      { name: "description", content: "Pelajari konsep hash SHA-256, blockchain, dan kenapa MaintProof memisahkan data master dari blockchain." },
    ],
  }),
  component: EdukasiPage,
});

const TOPICS = [
  {
    icon: Fingerprint,
    title: "Apa itu Hash SHA-256?",
    body: (
      <>
        <p>
          SHA-256 adalah algoritma kriptografi yang mengubah file apa pun — sebesar atau sekecil apa pun — menjadi
          kode unik sepanjang 64 karakter. Anggap saja seperti <em>sidik jari digital</em> dokumen.
        </p>
        <p>
          Dua dokumen yang sama persis akan menghasilkan hash yang sama. Sebaliknya, file yang berbeda
          (walau hanya 1 karakter) akan menghasilkan hash yang sangat berbeda.
        </p>
      </>
    ),
  },
  {
    icon: GitCommit,
    title: "Kenapa perubahan kecil mengubah hash total?",
    body: (
      <>
        <p>
          SHA-256 dirancang dengan sifat <strong>avalanche effect</strong>: perubahan satu bit pun akan mengubah
          hampir seluruh output. Ini yang membuatnya cocok untuk membuktikan integritas dokumen.
        </p>
        <p>
          Kalau seseorang mengedit laporan walau hanya satu spasi, hash baru tidak akan cocok dengan yang tercatat
          di blockchain — manipulasi langsung ketahuan.
        </p>
      </>
    ),
  },
  {
    icon: Lock,
    title: "Kenapa blockchain cocok untuk bukti integritas?",
    body: (
      <>
        <p>
          Setelah data tercatat di blockchain, data itu tidak bisa diubah atau dihapus tanpa terdeteksi.
          Ini disebut <strong>immutability</strong>.
        </p>
        <p>
          Untuk laporan maintenance, properti ini sangat berharga: kita bisa membuktikan dokumen sudah ada sejak
          waktu tertentu, didaftarkan oleh wallet tertentu, untuk equipment tertentu — tanpa perlu pihak ketiga.
        </p>
      </>
    ),
  },
  {
    icon: Database,
    title: "Kenapa data equipment tetap off-chain?",
    body: (
      <>
        <p>
          Nama area, bagian, dan equipment adalah <strong>data master</strong> yang sering berubah:
          equipment baru ditambahkan, nama bagian direstrukturisasi, dsb.
        </p>
        <p>
          Menyimpannya di blockchain akan mahal dan tidak fleksibel. Jadi data master tetap di aplikasi,
          sementara blockchain hanya menyimpan referensinya (kode equipment) bersama hash dan metadata penting.
        </p>
      </>
    ),
  },
  {
    icon: FileText,
    title: "Kenapa blockchain bukan database utama?",
    body: (
      <>
        <p>
          Blockchain lambat dan mahal untuk dipakai sebagai database umum. Setiap penulisan butuh transaksi
          dan biaya gas, dan tidak cocok untuk query kompleks.
        </p>
        <p>
          Pendekatan terbaik: gunakan blockchain hanya untuk hal yang benar-benar butuh integritas
          (bukti, hash, audit trail), dan database biasa untuk kebutuhan operasional sehari-hari.
        </p>
      </>
    ),
  },
];

function EdukasiPage() {
  return (
    <PageShell
      title="Edukasi Singkat"
      description="Konsep dasar di balik MaintProof, dijelaskan dengan bahasa sederhana."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {TOPICS.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="h-full">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl gradient-hero text-white">
                  <t.icon className="h-5 w-5" />
                </span>
                <h2 className="font-semibold">{t.title}</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">{t.body}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl gradient-hero p-6 text-center text-white shadow-glow">
        <div className="text-sm opacity-90">Ringkasnya:</div>
        <div className="mt-1 text-lg font-semibold sm:text-xl">
          File aman di laci Anda. Buktinya aman di blockchain.
        </div>
      </div>
    </PageShell>
  );
}

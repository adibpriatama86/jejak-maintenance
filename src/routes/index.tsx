import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, FileSearch, History, BookOpen, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MaintProof — Bukti Maintenance Berbasis Blockchain" },
      {
        name: "description",
        content:
          "Catat hash laporan maintenance ke blockchain dan verifikasi keasliannya kapan saja. Tidak ada upload file, hanya fingerprint.",
      },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Bukti yang tidak bisa dipalsukan",
    desc: "Hash SHA-256 dokumen tercatat permanen di blockchain dengan timestamp dan identitas pendaftar.",
  },
  {
    icon: FileSearch,
    title: "Verifikasi instan",
    desc: "Unggah dokumen — sistem akan mengonfirmasi apakah dokumen tersebut masih sama persis seperti yang dicatat.",
  },
  {
    icon: History,
    title: "Jejak audit lengkap",
    desc: "Lihat siapa, kapan, dan untuk equipment apa setiap laporan didaftarkan.",
  },
  {
    icon: BookOpen,
    title: "Privasi tetap terjaga",
    desc: "File tidak pernah diunggah ke blockchain. Hanya sidik jari kriptografisnya.",
  },
];

function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Demo edukasi · Berjalan di mode simulasi
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Bukti maintenance yang <span className="text-gradient">tidak bisa diubah</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
              MaintProof mencatat sidik jari (hash) laporan maintenance equipment ke blockchain.
              Anda bisa membuktikan keaslian dokumen kapan pun dibutuhkan.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/registrasi"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
              >
                Daftarkan Laporan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/verifikasi"
                className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-soft hover:shadow-glow"
              >
                Verifikasi Dokumen
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
            }}
            className="mx-auto mt-20 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="glass rounded-2xl p-5 shadow-soft transition hover:shadow-glow"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl gradient-hero text-white">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  );
}

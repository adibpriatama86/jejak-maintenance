import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-3xl p-10 text-center shadow-glow">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MaintProof — Verifikasi Integritas Laporan Maintenance" },
      {
        name: "description",
        content:
          "Sistem berbasis blockchain untuk mencatat dan memverifikasi keaslian laporan maintenance equipment menggunakan hash SHA-256.",
      },
      { name: "author", content: "MaintProof" },
      { property: "og:title", content: "MaintProof — Bukti Maintenance On-Chain" },
      { property: "og:description", content: "Catat hash dokumen maintenance ke blockchain. Verifikasi instan tanpa upload file." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('maintproof:theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <Providers>
      <div className="min-h-screen">
        <Navbar />
        <Outlet />
        <footer className="mx-auto max-w-7xl px-4 py-10 text-center text-xs text-muted-foreground sm:px-6">
          MaintProof · Demo edukasi · Data dummy, tidak menggambarkan perusahaan nyata
        </footer>
      </div>
    </Providers>
  );
}

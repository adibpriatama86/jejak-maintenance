# MaintProof — Solana Devnet Edition

MaintProof adalah sistem verifikasi integritas laporan maintenance berbasis
**Solana Devnet**. File asli tidak pernah meninggalkan browser — sistem hanya
mencatat **SHA-256 hash** + metadata laporan ke blockchain sebagai
**memo transaction** (tanpa smart contract / Anchor).

## Arsitektur "Solana-lite"

```
Browser (React)
  ├─ SHA-256 hash file (Web Crypto)
  ├─ Pilih equipment + isi metadata
  ├─ Bangun memo instruction → SPL Memo Program (MemoSq4g…)
  ├─ Phantom sign + submit ke Solana Devnet
  └─ Simpan signature di index lokal (untuk UI riwayat)
                ↓
        Solana Devnet (bukti permanen)
                ↓
        Solana Explorer (audit publik)
```

- **Sumber kebenaran:** memo on-chain di Solana Devnet.
- **Index lokal (localStorage):** hanya cache supaya halaman Riwayat ringan —
  setiap item bisa diverifikasi ke Explorer via tombol *Lihat Transaksi*.

## Tech stack

- React 19 + TanStack Start + TanStack Router
- Tailwind v4 + Framer Motion (UI dark glassmorphism)
- `@solana/web3.js` + `@solana/wallet-adapter-react` + Phantom adapter
- SPL Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`)

## Cara install

```bash
bun install        # atau: npm install
cp .env.example .env
```

`.env` opsional — default sudah pakai `https://api.devnet.solana.com`.

## Cara run lokal

```bash
bun dev            # atau: npm run dev
```

Buka <http://localhost:5173>.

## Install Phantom Wallet

1. Buka <https://phantom.app/download> → install ekstensi Chrome/Firefox/Brave,
   atau app Phantom di iOS/Android.
2. Buat wallet baru, simpan seed phrase.
3. Buka Settings → Developer Settings → **Testnet Mode: ON** lalu pilih
   network **Devnet**.

## Dapatkan SOL Devnet gratis

Pilih salah satu faucet:

- Faucet resmi: <https://faucet.solana.com> (paste address Phantom → request 1 SOL).
- Alchemy faucet: <https://www.alchemy.com/faucets/solana-devnet>.
- CLI: `solana airdrop 1 <ADDRESS> --url devnet`.

Tunggu beberapa detik sampai saldo muncul di Phantom (pastikan Phantom di mode
Devnet, bukan Mainnet).

## Cara demo aplikasi

1. **Hubungkan Phantom** dari pojok kanan atas (mode Devnet).
2. **Registrasi**: pilih Area → Bagian → Equipment, isi jenis maintenance &
   catatan, upload file. Hash SHA-256 dihitung otomatis di browser.
3. Klik **Daftarkan ke Blockchain** → approve transaksi di Phantom.
4. Setelah konfirmasi, signature muncul + tombol **Lihat di Solana Explorer**.
5. **Verifikasi**: upload ulang file → jika hash cocok dengan catatan
   on-chain, muncul *"Dokumen Terverifikasi"*. Kalau file diubah seujung
   byte pun, hash berbeda → ditolak.
6. **Riwayat**: tab *Riwayat Publik* untuk semua transaksi, *Riwayat Saya*
   untuk filter berdasarkan wallet yang terhubung.

## Catatan keamanan

- Memo Solana **bukan tempat menyimpan data rahasia** — hash & metadata yang
  ditulis bersifat publik. Jangan masukkan PII/rahasia di field catatan.
- Index lokal hanya untuk UX. Jika user pindah browser, data riwayat tidak
  ikut — tapi bukti on-chain tetap hidup selamanya di Devnet, dapat dicari
  via Explorer dengan signature.

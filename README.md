# MaintProof

Sistem verifikasi integritas laporan maintenance berbasis blockchain.
Mencatat **hash SHA-256** dokumen ke smart contract di Ethereum (Sepolia testnet),
sehingga keaslian laporan bisa diverifikasi kapan pun tanpa pernah mengunggah
file aslinya ke jaringan.

> ⚠️ Demo edukasi. Semua nama equipment, area, dan user adalah dummy.

## ✨ Fitur

- **Dashboard** — ringkasan jumlah laporan, equipment, network, dan status wallet
- **Registrasi Laporan** — pilih area → bagian → equipment, hitung hash file di browser, kirim ke blockchain
- **Verifikasi Dokumen** — upload file atau tempel hash, sistem cek apakah pernah didaftarkan
- **Riwayat** — daftar transaksi pendaftaran terbaru lengkap dengan jejak audit
- **Edukasi** — penjelasan singkat tentang hash, blockchain, dan arsitektur sistem
- Theme **Terang / Gelap / Sistem**, default mengikuti device
- **Mode Simulasi**: jika `VITE_CONTRACT_ADDRESS` belum diisi, app berjalan
  sepenuhnya secara lokal (data disimpan di `localStorage`) — cocok untuk demo cepat tanpa wallet & gas.

## 🧱 Tech Stack

| Layer            | Pilihan                                |
| ---------------- | -------------------------------------- |
| Frontend         | React 19 + TypeScript + Vite + TanStack Start |
| Styling          | Tailwind CSS v4 + design tokens (oklch) |
| Animasi          | Framer Motion                          |
| Web3             | wagmi v2 + viem (injected connectors)  |
| Hash             | Web Crypto API (SHA-256)               |
| Smart Contract   | Solidity 0.8.24                        |
| Local/Testnet    | Hardhat                                |
| Target Deploy    | Sepolia Testnet                        |

## 🚀 Cara Menjalankan Frontend

```bash
bun install
cp .env.example .env       # opsional, untuk Mode Simulasi tidak wajib diisi
bun dev
```

Buka http://localhost:5173.

## ⛓️ Deploy Smart Contract ke Sepolia

> Sudah include `contracts/MaintenanceRegistry.sol` dan script Hardhat.

1. Install Hardhat (sekali saja):

   ```bash
   bun add -d hardhat @nomicfoundation/hardhat-toolbox dotenv
   ```

2. Isi `.env`:

   ```
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<API_KEY>
   PRIVATE_KEY=0xprivate_key_wallet_deployer
   ```

   Pastikan wallet deployer punya ETH Sepolia (gunakan faucet seperti
   https://sepoliafaucet.com).

3. Compile & deploy:

   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.cjs --network sepolia
   ```

4. Catat address yang ter-print, lalu set di `.env` aplikasi:

   ```
   VITE_CONTRACT_ADDRESS=0x...
   VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<API_KEY>
   ```

5. Restart dev server.

## 🦊 Connect Wallet

- Aplikasi memakai **injected connector** wagmi (mendukung MetaMask, Brave Wallet, Coinbase Wallet extension, Rabby, dll).
- Wallet **hanya wajib** untuk aksi “Daftarkan ke Blockchain”.
- Dashboard, Verifikasi, Riwayat, dan Edukasi tetap bisa dibuka tanpa wallet.
- Pastikan jaringan diset ke **Sepolia** (tombol di menu wallet membantu melakukan switch otomatis).

## 🧪 Cara Demo

1. Buka **/registrasi**, hubungkan wallet (atau biarkan di Mode Simulasi).
2. Pilih Area → Bagian → Equipment.
3. Pilih jenis maintenance, tulis catatan, upload file (PDF/JPG/PNG).
4. Browser akan menghitung hash SHA-256.
5. Klik **Daftarkan ke Blockchain**. Tunggu konfirmasi.
6. Buka **/verifikasi**, upload file yang sama → status “Terverifikasi”.
7. Coba edit file sedikit (atau pilih file berbeda) → status “Tidak Terverifikasi”.
8. Buka **/riwayat** untuk melihat audit trail.

## 🗂️ Struktur Folder

```
contracts/                   Smart contract Solidity
scripts/deploy.cjs           Hardhat deploy script
src/
  components/                Navbar, theme toggle, wallet button, providers
  data/                      Dummy database (equipment, users)
  hooks/                     Hooks reusable
  lib/                       hash.ts, registry.ts, wagmi.ts
  routes/                    File-based routes (dashboard, registrasi, ...)
  styles.css                 Design tokens + utilities
```

## 🧠 Arsitektur Data

| Lapisan      | Disimpan di sini                                        |
| ------------ | ------------------------------------------------------- |
| **Off-chain** (frontend) | Daftar area, bagian, equipment, user dummy + mapping wallet → nama |
| **On-chain** (contract)  | `fileHash`, `equipmentCode`, `maintenanceType`, `note`, `timestamp`, `registeredBy` |

File asli tidak pernah dikirim ke jaringan. Hanya **hash** yang on-chain.

## 📜 Lisensi

MIT — silakan dipakai untuk belajar.

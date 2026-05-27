import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from "@solana/web3.js";

export const SOLANA_CLUSTER = "devnet" as const;
export const SOLANA_ENDPOINT =
  import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl("devnet");

// SPL Memo Program ID (v2)
export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

export const NETWORK_LABEL = "Solana Devnet";

let _connection: Connection | null = null;
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(SOLANA_ENDPOINT, "confirmed");
  }
  return _connection;
}

export function explorerTxUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function explorerAddressUrl(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

/** Bangun TransactionInstruction memo dengan payload string. */
export function buildMemoInstruction(payload: string, signer: PublicKey) {
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: new TextEncoder().encode(payload) as unknown as Buffer,
  });
}

/** Bangun Transaction memo siap dikirim. */
export async function buildMemoTransaction(payload: string, payer: PublicKey) {
  const connection = getConnection();
  const tx = new Transaction().add(buildMemoInstruction(payload, payer));
  tx.feePayer = payer;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  return { tx, blockhash, lastValidBlockHeight };
}

export function shortSignature(sig?: string | null) {
  if (!sig) return "-";
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
}

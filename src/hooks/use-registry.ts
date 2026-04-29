import { useEffect, useState } from "react";
import { subscribeRegistry } from "@/lib/registry";

/** Memicu re-render saat registry berubah. */
export function useRegistryVersion() {
  const [v, setV] = useState(0);
  useEffect(() => subscribeRegistry(() => setV((x) => x + 1)), []);
  return v;
}

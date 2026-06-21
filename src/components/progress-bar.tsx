import { motion } from "framer-motion";
import { STATUS_PROGRESS, STATUS_THEME, type MaintenanceStatus } from "@/lib/status";

export function ProgressBar({
  status,
  className = "",
  size = "md",
}: {
  status: MaintenanceStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const pct = STATUS_PROGRESS[status];
  const theme = STATUS_THEME[status];
  const h = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div className={className}>
      <div
        className={`relative w-full overflow-hidden rounded-full bg-secondary ${h}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-y-0 left-0 rounded-full ${theme.bar}`}
        />
      </div>
      {size === "md" && (
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>{pct}% progres</span>
          <span className="font-medium">{status}</span>
        </div>
      )}
    </div>
  );
}

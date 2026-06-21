import { STATUS_LABEL_ID, STATUS_THEME, type MaintenanceStatus } from "@/lib/status";

export function StatusBadge({
  status,
  className = "",
}: {
  status: MaintenanceStatus;
  className?: string;
}) {
  const theme = STATUS_THEME[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${theme.chip} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
      {STATUS_LABEL_ID[status]}
    </span>
  );
}

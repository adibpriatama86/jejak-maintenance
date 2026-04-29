import { useTheme, type Theme } from "@/components/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion } from "framer-motion";

const OPTIONS: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="glass relative inline-flex rounded-full p-1 shadow-soft" role="radiogroup" aria-label="Pilih tema">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            onClick={() => setTheme(opt.value)}
            className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            {active && (
              <motion.span
                layoutId="theme-pill"
                className="absolute inset-0 rounded-full bg-primary shadow-glow"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Icon className={`relative h-4 w-4 ${active ? "text-primary-foreground" : ""}`} />
          </button>
        );
      })}
    </div>
  );
}

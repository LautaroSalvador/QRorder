"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent transition-colors hover:bg-muted focus-visible:outline-none"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Alternar tema oscuro"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
      <span className="sr-only">Alternar tema</span>
    </button>
  );
}

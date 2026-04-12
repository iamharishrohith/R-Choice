"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        style={{
          background: "transparent",
          border: "none",
          width: 20,
          height: 20,
        }}
        aria-label="Loading theme"
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      type="button"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-primary)",
      }}
      aria-label="Toggle theme"
    >
      <Sun size={20} style={{ display: theme === "light" ? "none" : "block" }} />
      <Moon size={20} style={{ display: theme === "light" ? "block" : "none" }} />
    </button>
  );
}

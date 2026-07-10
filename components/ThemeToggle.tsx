"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    setTheme(stored === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const options: { value: Theme; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "☀" },
    { value: "dark", label: "Dark", icon: "☾" },
  ];

  return (
    <div className="inline-flex items-center rounded-full bg-fm-text/5 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setTheme(o.value)}
          aria-label={`${o.label} mode`}
          aria-pressed={theme === o.value}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            theme === o.value
              ? "bg-fm-bg text-fm-text shadow-sm"
              : "text-fm-muted hover:text-fm-text"
          }`}
        >
          <span aria-hidden="true">{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

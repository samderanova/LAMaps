"use client";

import { Moon as MoonIcon, Sun as SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useMediaQuery } from "usehooks-ts";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const prefersDark = useMediaQuery("prefers-color-scheme: dark");

  const systemTheme = prefersDark ? "dark" : "light";

  const currentTheme =
    theme !== "light" && theme !== "dark" ? systemTheme : theme;

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";

    setTheme(newTheme);

    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn("btn btn-sm btn-ghost swap swap-rotate h-full")}
    >
      <input type="checkbox" checked={theme === "light"} />
      <SunIcon className="swap-on text-base-content" />
      <MoonIcon className="swap-off text-base-content" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

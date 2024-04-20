"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

export function ModeToggle() {
  const { setTheme } = useTheme();

  const handleThemeChange = (theme: string) => {
    document.documentElement.setAttribute("data-theme", theme);
    setTheme(theme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Page() {
  const [excalidraw, setExcalidraw] = useState<ExcalidrawImperativeAPI>();

  useEffect(() => {
    if (excalidraw == null) return;
    console.log("loaded: ", excalidraw);
  }, [excalidraw]);

  const handleDraw = useCallback(() => {
    console.log("state: ", excalidraw?.getAppState());
    console.log("drawing elements: ", excalidraw?.getSceneElements());
  }, [excalidraw]);

  return (
    <div>
      <h1>Hello, World</h1>
      <ModeToggle />
      <div style={{ height: "500px" }}>
        <Excalidraw excalidrawAPI={setExcalidraw} />
      </div>
      <Button onClick={handleDraw}>Draw on Map</Button>
    </div>
  );
}

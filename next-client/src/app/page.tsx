"use client";
import "./Map.css";
import "leaflet/dist/leaflet.css";

import { Moon, Sun } from "lucide-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { Marker, TileLayer } from "react-leaflet";
import { useMediaQuery } from "usehooks-ts";

import { exportToBlob, Footer } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { Routes } from "./Map";

const ATTRIBUTION_MARKUP =
  '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

const MapContainer = dynamic(
  async () => {
    const mod = await import("react-leaflet");
    return mod.MapContainer;
  },
  {
    loading: () => <p>Loading</p>,
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
    <div className="flex flex-col sm:flex-row">
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
    </div>
  );
}

const boxWidth = -117.846837 - -117.837999;

const boxHeight = 33.648 - 33.6432;

function App() {
  const map = useRef<L.Map | null>(null);

  const [excalidraw, setExcalidraw] = useState<ExcalidrawImperativeAPI>();

  const [waypoints, setWaypoints] = useState(new Array<L.LatLngTuple>());

  const [center, setCenter] = useState<L.LatLngTuple>([33.6459, -117.842717]);

  const [lat, setLat] = useState<string>("");

  const [lon, setLon] = useState<string>("");

  const isLarge = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      getPosSuccess,
      getPosError,
      options,
    );
  }, []);

  function getPosSuccess(pos: GeolocationPosition) {
    const { latitude, longitude } = pos.coords;

    setCenter([latitude, longitude]);
  }

  function getPosError(err: GeolocationPositionError) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  useEffect(() => {
    if (excalidraw == null) return;
    // console.log("loaded: ", excalidraw);
  }, [excalidraw]);

  const handleDraw = useCallback(async () => {
    if (excalidraw == null) return;

    const elements = excalidraw.getSceneElements();
    const state = excalidraw.getAppState();

    const width = state.width;
    const height = state.height;

    const newWaypoints: L.LatLngTuple[] = [];

    elements.forEach((element) => {
      if (element.type === "freedraw") {
        element.points.forEach((point) => {
          const deltaX = element.x + point[0];
          const deltaY = element.y + point[1];
          const fractionX = deltaX / width;
          const fractionY = deltaY / height;

          const lat = center[0] - fractionY * boxHeight;
          const long = center[1] - fractionX * boxWidth;

          newWaypoints.push([lat, long]);
        });
      }

      if (element.type === "line") {
        const deltaX = element.x;
        const deltaY = element.y;
        const fractionX = deltaX / width;
        const fractionY = deltaY / height;

        const lat = center[0] - fractionY * boxHeight;
        const long = center[1] - fractionX * boxWidth;

        newWaypoints.push([lat, long]);
      }
    });

    const blob = await exportToBlob({
      elements,
      files: excalidraw.getFiles(),
      getDimensions: () => {
        return { width: 350, height: 350 };
      },
    });

    await fetch("/maps/...", {
      method: "POST",
      body: blob,
      headers: {
        "Content-Type": "image/png",
      },
    });

    setWaypoints(newWaypoints);
  }, [excalidraw, center]);

  return (
    <div>
      <div>HEADER</div>

      <main className="min-h-screen flex w-full p-8">
        <ResizablePanelGroup
          direction={isLarge ? "horizontal" : "vertical"}
          className="w-full !h-auto grow rounded-box"
        >
          <ResizablePanel className="relative">
            <MapContainer
              ref={map}
              className="w-full h-full"
              center={center}
              zoom={16}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution={ATTRIBUTION_MARKUP}
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={center!} />

              {waypoints.map((waypoint, index) => {
                return <Marker key={index} position={waypoint} />;
              })}

              {waypoints.length && <Routes latLngTuples={waypoints} />}
            </MapContainer>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel>
            <Excalidraw excalidrawAPI={setExcalidraw} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <div>FOOTER</div>
    </div>
  );
}

export default App;

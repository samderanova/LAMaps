"use client";
import "./Map.css";
import "leaflet/dist/leaflet.css";

import { useCallback, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { Marker, TileLayer } from "react-leaflet";
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

const boxWidth = -117.846837 - -117.837999;

const boxHeight = 33.648 - 33.6432;

function App() {
  const [excalidraw, setExcalidraw] = useState<ExcalidrawImperativeAPI>();
  const [waypoints, setWaypoints] = useState(new Array<L.LatLngTuple>());

  useEffect(() => {
    if (excalidraw == null) return;
    // console.log("loaded: ", excalidraw);
  }, [excalidraw]);

  const handleDraw = useCallback(() => {
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

          const lat = 33.648 - fractionY * boxHeight;
          const long = -117.846837 - fractionX * boxWidth;

          newWaypoints.push([lat, long]);
        });

        // const deltaX = element.x; // element.points[1][0] - element.points[0][0];
        // const deltaY = element.y; // element.points[1][1] - element.points[0][1];
        // const fractionX = deltaX / width;
        // const fractionY = deltaY / height;

        // const lat = 33.648 - fractionY * boxHeight;
        // const long = -117.846837 - fractionX * boxWidth;

        // newWaypoints.push([lat, long]);

        // console.log(
        //   { lat, long, fractionX, fractionY, width, height, deltaX, deltaY },
        //   element,
        // );

        return;
      }
      if (element.type === "line") {
        const deltaX = element.x; // element.points[1][0] - element.points[0][0];
        const deltaY = element.y; // element.points[1][1] - element.points[0][1];
        const fractionX = deltaX / width;
        const fractionY = deltaY / height;

        const lat = 33.648 - fractionY * boxHeight;
        const long = -117.846837 - fractionX * boxWidth;

        newWaypoints.push([lat, long]);

        console.log(
          { lat, long, fractionX, fractionY, width, height, deltaX, deltaY },
          element,
        );

        return;
      }
    });

    setWaypoints(newWaypoints);
  }, [excalidraw]);

  console.log({ waypoints });

  return (
    <div className="h-screen w-screen">
      <ModeToggle />
      <div className="grid grid-rows-2 md:grid-rows-none gap-2 md:grid-cols-2 h-full w-full">
        <div className="relative">
          <MapContainer
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              zIndex: 0,
            }}
            center={[33.6459, -117.842717]}
            zoom={16}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution={ATTRIBUTION_MARKUP}
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Top Left
          <Marker position={[33.648, -117.846837]} />
         */}

            {/* Top Right
          <Marker position={[33.648, -117.837999]} />

          {/* Bottom Left 
          <Marker position={[33.6432, -117.846837]} />
          */}

            {/* Bottom Right 
          <Marker position={[33.6432, -117.837999]} />
          */}

            {waypoints.map((waypoint, index) => {
              return <Marker key={index} position={waypoint} />;
            })}

            {/* */}
            <Routes latLngTuples={waypoints} />
          </MapContainer>
        </div>

        <div className="w-full h-full">
          <Excalidraw excalidrawAPI={setExcalidraw} />
          <Button
            onClick={handleDraw}
            className="absolute bottom-0.5 right-0 z-50"
          >
            Draw on Map
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;

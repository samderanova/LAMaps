"use client";
import "./Map.css";
import "leaflet/dist/leaflet.css";

import { exportToBlob, THEME } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { Marker, TileLayer } from "react-leaflet";
import { useMediaQuery } from "usehooks-ts";

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

const boxWidth = -117.846837 - -117.837999;

const boxHeight = 33.648 - 33.6432;

function App() {
  const map = useRef<L.Map | null>(null);

  const [excalidraw, setExcalidraw] = useState<ExcalidrawImperativeAPI>();

  const [waypoints, setWaypoints] = useState(new Array<L.LatLngTuple>());

  const [center, setCenter] = useState<L.LatLngTuple>([33.6459, -117.842717]);

  const [loading, setLoading] = useState(false);

  const isLarge = useMediaQuery("(min-width: 768px)");

  const { theme } = useTheme();

  const prefersDark = useMediaQuery("prefers-color-scheme: dark");

  const systemTheme = prefersDark ? "dark" : "light";

  const currentTheme =
    theme !== "light" && theme !== "dark" ? systemTheme : theme;

  useEffect(() => {
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.warn(`ERROR(${error.code}): ${error.message}`);
      },
      options,
    );
  }, []);

  const handleDraw = useCallback(async () => {
    setLoading(true);

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

		const formData = new FormData();
		formData.set("latitude", "33.6459");
		formData.set("longitude", "-117.842717");
		formData.set("image", blob);
    formData.set("max_points", '20');



    const res = await fetch("/api/maps/coordinatize", {
      method: "POST",
      body: formData,
    });

    const content = await res.json();

    const points = content.points;

    setWaypoints(newWaypoints);

    setLoading(false);
  }, [excalidraw, center]);

  return (
    <main className="w-full grow">
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Hello there</h1>
            <p className="py-6">
              Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
              excepturi exercitationem quasi. In deleniti eaque aut repudiandae
              et a id nisi.
            </p>
            <a href="/#demo" className="btn btn-primary">
              Get Started
            </a>
          </div>
        </div>
      </div>

      <div className="h-dvh flex items-center">
        <div className="w-full h-5/6 p-8">
          <ResizablePanelGroup
            direction={isLarge ? "horizontal" : "vertical"}
            id="demo"
            className="w-full h-full rounded-box border"
          >
            <ResizablePanel className="relative">
              <MapContainer
                ref={map}
                className="w-full h-full !z-0"
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
              </MapContainer>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel className="flex flex-col justify-end gap-2 p-1">
              <Excalidraw
                excalidrawAPI={setExcalidraw}
                theme={currentTheme === "light" ? THEME.LIGHT : THEME.DARK}
              />
              <button onClick={handleDraw} className="btn btn-primary btn-sm">
                <span className={cn(loading && "loading")}></span>
                <span>Submit</span>
              </button>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </main>
  );
}

export default App;

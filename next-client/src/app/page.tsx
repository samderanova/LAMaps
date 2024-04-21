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
import { Polyline, Marker, TileLayer } from "react-leaflet";
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

const midLat = 0.02360000000000184;

const midLon = 0.0175;

const lat = 33.6459;

const lon = -117.842717;

function App() {
  const map = useRef<L.Map | null>(null);

  const [excalidraw, setExcalidraw] = useState<ExcalidrawImperativeAPI>();

  const [waypoints, setWaypoints] = useState(new Array<L.LatLngTuple>());

  const [center, setCenter] = useState<L.LatLngTuple>([lat, lon]);

  const [loading, setLoading] = useState(false);

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

    const topLeft = [center[0] + midLat, center[1] - midLon];
    const topRight = [center[0] + midLat, center[1] + midLon];
    const botLeft = [center[0] - midLat, center[1] + midLon];
    const botRight = [center[0] - midLat, center[1] - midLon];

    formData.set("latitude", "33.6459");
    formData.set("longitude", "-117.842717");
    formData.set("image", blob);
    formData.set("max_points", "20");
    formData.set("topLeft", JSON.stringify(topLeft));
    formData.set("topRight", JSON.stringify(topRight));
    formData.set("botLeft", JSON.stringify(botLeft));
    formData.set("botRight", JSON.stringify(botRight));

    const res = await fetch("/api/maps/coordinatize", {
      method: "POST",
      body: formData,
    });

    const content = await res.json();

    const points: [number, number][] = content.points;

    setWaypoints(points);

    setLoading(false);
  }, [excalidraw, center]);

  const waypointsPaired = waypoints.reduce((acc, cur, index) => {
    acc.push([cur]);

    if (index > 0) {
      acc[index - 1]?.push(cur);
    }
    return acc;
  }, [] as L.LatLngTuple[][]);

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

      <div className="h-dvh flex flex-col justify-center items-center gap-2">
        <div className="relative w-full h-full p-8">
          <MapContainer
            ref={map}
            className="absolute top-0 left-0 w-full h-full !z-0"
            center={center}
            zoom={14}
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <TileLayer
              attribution={ATTRIBUTION_MARKUP}
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={center} />

            {/* Top right */}
            <Marker position={[lat + midLat, lon + midLon]} />

            {/* Top left */}
            <Marker position={[lat + midLat, lon - midLon]} />

            {/* bottom right */}
            <Marker position={[lat - midLat, lon + midLon]} />

            {/* bottom left */}
            <Marker position={[lat - midLat, lon - midLon]} />

            {waypoints.map((waypoint, index) => {
              return <Marker key={index} position={waypoint} />;
            })}

            {waypointsPaired.length &&
              waypointsPaired.map((waypoint) => {
                return (
                  <Polyline
                    pathOptions={{ color: "red" }}
                    positions={waypoint}
                  />
                );
              })}

            {/* waypoints.length && <Routes latLngTuples={waypoints} /> */}
          </MapContainer>

          <div className="absolute top-0 left-0 w-full h-full opacity-50">
            <Excalidraw
              excalidrawAPI={setExcalidraw}
              theme={currentTheme === "light" ? THEME.LIGHT : THEME.DARK}
            />
          </div>
        </div>

        <button
          onClick={handleDraw}
          className="btn btn-primary btn-sm btn-wide"
        >
          <span className={cn(loading && "loading")}></span>
          <span>Submit</span>
        </button>
      </div>
    </main>
  );
}

export default App;

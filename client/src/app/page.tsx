"use client";
import "./Map.css";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { exportToBlob, THEME } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { cn, coordinatize } from "@/lib/utils";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Polyline, Marker, TileLayer } from "react-leaflet";
import { useMediaQuery } from "usehooks-ts";
import { NominatimCombobox } from "@/components/nominatim-combobox";
import MapListener from "@/components/MapListener/MapListener";
import { MapFlyer } from "@/components/map-flyer";

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
  const [excalidraw, setExcalidraw] = useState<ExcalidrawImperativeAPI>();

  const [waypoints, setWaypoints] = useState(new Array<L.LatLngTuple>());

  const [center, setCenter] = useState<L.LatLngTuple>([34.06886, -118.435036]);

  const initialBounds = L.latLngBounds(
    L.latLng(center[0] - 0.003, center[1] - 0.003),
    L.latLng(center[0] + 0.003, center[1] + 0.003),
  );

  const [loading, setLoading] = useState(false);

  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(
    initialBounds,
  );

  const [gpxHref, setGpxHref] = useState<string>("");

  const [gpxFilename, setGpxFilename] = useState<string>("");

  const [isSnap, setIsSnap] = useState<boolean>(true);

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

  const submitDrawing = useCallback(async () => {
    if (excalidraw == null) return;

    try {
      setLoading(true);

      const elements = excalidraw.getSceneElements();
      const state = excalidraw.getAppState();

      const width = state.width;
      const height = state.height;

      const newWaypoints: L.LatLngTuple[] = [];

      elements.forEach((element) => {
        if (element.type === "freedraw" || element.type === "line") {
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
      });

      const blob = await exportToBlob({
        elements,
        files: excalidraw.getFiles(),
        getDimensions: () => {
          return { width: 500, height: 500 };
        },
      });

      const content = await coordinatize(mapBounds, blob, isSnap);

      const decoded = atob(content.gpxFile);

      const decodedBlob = new Blob([decoded], {
        type: "text/plain;charset=utf-8",
      });

      const filename = "encoded_data.gpx";

      setGpxHref(URL.createObjectURL(decodedBlob));
      setGpxFilename(filename);

      const points: [number, number][] = content.points;

      setWaypoints(points);
    } finally {
      setLoading(false);
    }
  }, [excalidraw, center, mapBounds]);

  const waypointsPaired = waypoints.reduce((acc, cur, index) => {
    acc.push([cur]);

    if (index > 0) {
      acc[index - 1]?.push(cur);
    }
    return acc;
  }, [] as L.LatLngTuple[][]);

  return (
    <main className="w-full grow">
      <div className="p-4 h-dvh flex flex-col justify-center items-center gap-2">
        <NominatimCombobox onSelect={setCenter} />

        <div className="relative w-full h-full grid grid-rows-2 md:grid-rows-none md:grid-cols-2 gap-5">
          <MapContainer
            className="absolute top-0 left-0 w-full h-full !z-0 rounded-box border p-5"
            center={center}
            bounds={initialBounds}
            scrollWheelZoom={true}
            zoomControl={false}
            zoom={14}
          >
            <div
              className="absolute inset-x-1 inset-y-1.5 text-center z-50"
              style={{ zIndex: 5000 }}
            >
              <MapFlyer coordinates={center} />
            </div>

            <MapListener setCenter={setCenter} setBounds={setMapBounds} />

            <TileLayer
              attribution={ATTRIBUTION_MARKUP}
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={center!} />

            {waypointsPaired.length &&
              waypointsPaired.map((waypoint) => {
                return (
                  <Polyline
                    pathOptions={{ color: "red" }}
                    positions={waypoint}
                  />
                );
              })}
          </MapContainer>

          <div className="absolute top-0 left-0 w-full h-full flex flex-col rounded-box justify-end gap-2 p-5 border ">
            <div className="w-full h-full opacity-50">
              <Excalidraw
                excalidrawAPI={setExcalidraw}
                theme={currentTheme === "light" ? THEME.LIGHT : THEME.DARK}
              />
            </div>

            <div className="flex flex-row w-full gap-2">
              <button onClick={submitDrawing} className="btn btn-primary gap-0">
                <span className={cn(loading && "loading me-2")}></span>
                <span>Submit</span>
              </button>

              <button
                className={"btn btn-primary btn-outline"}
                onClick={() => {}}
                disabled={gpxHref === ""}
              >
                <a href={gpxHref} download={gpxFilename}>
                  Download .gpx
                </a>
              </button>

              <div className="w-full ms-auto">
                <div className="form-control justify-center items-end h-full">
                  <label className="label cursor-pointer gap-2">
                    <span className="label-text">Use Snap</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={isSnap}
                      onClick={() => setIsSnap(!isSnap)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;

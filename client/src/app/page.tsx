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
import { Polyline, Marker, TileLayer, useMapEvent } from "react-leaflet";
import { useMediaQuery } from "usehooks-ts";
import { NominatimCombobox } from "@/components/nominatim-combobox";

const ATTRIBUTION_MARKUP =
  '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

function MapClickListener(props) {
  const map = useMapEvent('click', (e) => {
    const lng = e.latlng.lng
    const lat = e.latlng.lat
    props.setCenter([lat, lng])
  })
  return null
}

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
        return { width: 500, height: 500 };
      },
    });

    const formData = new FormData();
    formData.set("latitude", "33.6459");
    formData.set("longitude", "-117.842717");
    formData.set("image", blob);
    formData.set("max_points", "20");

    const res = await fetch("/api/maps/coordinatize", {
      method: "POST",
      body: formData,
    });

    const content = await res.json();

    const points: [number, number][] = content.points;
    const fileEncoded = content.gpxFile;


    function saveFile(b64FileContents: string) {
        // Replace 'your_base64_string' with the actual encoded string from Python
        const decoded = atob(b64FileContents);
        const blob = new Blob([decoded], {type: "text/plain;charset=utf-8"});
        const filename = "encoded_data.gpx";

        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        // Revoke the object URL to avoid memory leaks
        URL.revokeObjectURL(link.href);
    }

    saveFile(fileEncoded)

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

  console.log(map);

  const handleSelectLocation = (coordinate: L.LatLngTuple) => {
    setCenter(coordinate);
    console.log("asdf", map.current);
    map.current?.flyTo(coordinate, 18);
  };

  return (
    <main className="w-full grow">
      <div className="p-4 h-dvh flex flex-col justify-center items-center gap-2">
        <div className="w-full h-5/6">
          <ResizablePanelGroup
            direction={isLarge ? "horizontal" : "vertical"}
            id="demo"
            className="w-full h-full rounded-box border"
          >
            <ResizablePanel className="relative">
              <MapContainer
                ref={map}
                className="relative w-full h-full !z-0"
                center={center}
                zoom={16}
                scrollWheelZoom={true}
              >
                <MapClickListener setCenter={(latlng)=>setCenter(latlng)}/>
                <div
                  className="absolute top-0 left-0 z-50"
                  style={{ zIndex: 5000 }}
                >
                  <NominatimCombobox onSelect={handleSelectLocation} />
                </div>

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

                {/* waypoints.length && <Routes latLngTuples={waypoints} /> */}
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

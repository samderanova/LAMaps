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
import { cn, coordinatize } from "@/lib/utils";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { Polyline, Marker, TileLayer } from "react-leaflet";
import { useMediaQuery } from "usehooks-ts";
import { NominatimCombobox } from "@/components/nominatim-combobox";
import MapListener from "@/components/MapListener/MapListener";

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
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
	const [gpxHref, setGpxHref] = useState<string>("");
	const [gpxFilename, setGpxFilename] = useState<string>("");

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

	const submitDrawing = useCallback(async () => {
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

		const content = await coordinatize(center, mapBounds, blob);

		const decoded = atob(content.gpxFile);
		const decodedBlob = new Blob([decoded], {
			type: "text/plain;charset=utf-8",
		});
		const filename = "encoded_data.gpx";

		setGpxHref(URL.createObjectURL(decodedBlob));
		setGpxFilename(filename);

		const points: [number, number][] = content.points;
		setWaypoints(points);
		setLoading(false);
	}, [excalidraw, center, mapBounds]);

	const waypointsPaired = waypoints.reduce((acc, cur, index) => {
		acc.push([cur]);

		if (index > 0) {
			acc[index - 1]?.push(cur);
		}
		return acc;
	}, [] as L.LatLngTuple[][]);

	const handleSelectLocation = (coordinate: L.LatLngTuple) => {
		setCenter(coordinate);
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
								<div
									className="absolute top-0 left-0 z-50"
									style={{ zIndex: 5000 }}
								>
									<NominatimCombobox onSelect={handleSelectLocation} />
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

								{/* waypoints.length && <Routes latLngTuples={waypoints} /> */}
							</MapContainer>
						</ResizablePanel>

						<ResizableHandle />

						<ResizablePanel className="flex flex-col justify-end gap-2 p-1">
							<Excalidraw
								excalidrawAPI={setExcalidraw}
								theme={currentTheme === "light" ? THEME.LIGHT : THEME.DARK}
							/>
							<div className="flex flex-row w-full gap-2">
								<button
									onClick={submitDrawing}
									className="btn btn-primary gap-0"
								>
									<span className={cn(loading && "loading me-2")}></span>
									<span>Submit</span>
								</button>

								<button
									className={"btn btn-primary btn-outline"}
									onClick={() => { }}
									disabled={gpxHref === ""}
								>
									<a href={gpxHref} download={gpxFilename}>
										Download .gpx
									</a>
								</button>
							</div>
						</ResizablePanel>
					</ResizablePanelGroup>
				</div>
			</div>
		</main>
	);
}

export default App;

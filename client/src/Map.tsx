import "./Map.css";
import "leaflet/dist/leaflet.css";

import * as L from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";

import "leaflet-routing-machine";

import { useState, useEffect } from "react";
import {
	createElementHook,
	createElementObject,
	useLeafletContext,
} from "@react-leaflet/core";
import type { LeafletContextInterface } from "@react-leaflet/core";

const ATTRIBUTION_MARKUP =
	'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';

interface RoutesProps {
	/**
	 * Waypoints needs to be `L.Routing.Waypoint[]` or `LatLng[]` when creating an `L.Routing.plan`.
	 * For ease of use from outside, pass in a valid `LatLngTuple[]`, and convert to LatLng inside.
	 * @example [[33.6405, -117.8443], [33.6405, -117.8443]]
	 */
	latLngTuples: L.LatLngTuple[];
}

/**
 * Use react-leaflet's core API to manage lifecycle of leaflet elements properly.
 * @see {@link https://react-leaflet.js.org/docs/core-architecture/#element-hook-factory}
 */
function createRouter(props: RoutesProps, context: LeafletContextInterface) {
	const latLngTuples = props.latLngTuples ?? [];

	/**
	 * Convert each tuple to an actual `LatLng` object.
	 */
	const waypoints = latLngTuples.map((latLngTuple) => L.latLng(latLngTuple));

	const routerControl = L.Routing.control({
		router: L.Routing.osrmv1(),

		plan: L.Routing.plan(waypoints),
	});

	const router = createElementObject(routerControl, context);
	return router;
}

/**
 * Given waypoints of a route and a color for the route, draw a route to the map.
 * Forward the props to a custom hook that manages the leaflet element's lifecycle.
 */
export function Routes(props: RoutesProps) {
	const context = useLeafletContext();
	const routerRef = useRouter(props, context);

	useEffect(() => {
		routerRef.current.instance.addTo(context.map);
		routerRef.current.instance.hide();
		return () => {
			routerRef.current.instance.remove();
		};
	}, [context.map, routerRef]);

	return null;
}

/**
 * Turn the createRouter function into a hook for the main component.
 */
const useRouter = createElementHook(createRouter);

export default function Map() {
	const [latLngTuples, setLatLangTuples] = useState<Array<L.LatLngTuple>>([]);

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
		setLatLangTuples([...latLngTuples, [latitude, longitude]]);
	}

	function getPosError(err: GeolocationPositionError) {
		console.warn(`ERROR(${err.code}): ${err.message}`);
	}

	return latLngTuples.length ? (
		<MapContainer
			style={{
				width: "100%",
				height: "100%",
				position: "absolute",
				zIndex: 0,
			}}
			center={latLngTuples[0]}
			zoom={13}
			scrollWheelZoom={true}
		>
			<TileLayer
				attribution={ATTRIBUTION_MARKUP}
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>

			<Routes latLngTuples={latLngTuples} />
		</MapContainer>
	) : null;
}

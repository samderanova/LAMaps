import type { Map } from "leaflet";
import type { Dispatch, SetStateAction } from "react";
import { useMapEvents } from "react-leaflet";

interface MapListenerProps {
	setBounds: Dispatch<SetStateAction<L.LatLngBounds | null>>;
	setCenter: Dispatch<SetStateAction<L.LatLngTuple>>;
}

export default function MapListener({
	setBounds,
	setCenter,
}: MapListenerProps) {
	const updateBounds = (map: Map) => {
		const bounds = map.getBounds();
		setBounds(bounds);
	};
	const map = useMapEvents({
		click: (e) => {
			const lng = e.latlng.lng;
			const lat = e.latlng.lat;
			setCenter([lat, lng]);
		},
		dragend: () => {
			updateBounds(map);
		},
		zoom: () => {
			updateBounds(map);
		},
		load: () => {
			updateBounds(map);
		},
	});
	return null;
}

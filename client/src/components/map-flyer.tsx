import { useEffect } from "react";
import { useMap } from "react-leaflet";

export type MapFlyerProps = {
  coordinates: L.LatLngTuple;
};

export function MapFlyer(props: MapFlyerProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(props.coordinates);
  });

  return null;
}

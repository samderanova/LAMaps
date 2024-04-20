import "./Map.css";
import "leaflet/dist/leaflet.css";

import * as L from "leaflet";

import "leaflet-routing-machine";

import { useEffect } from "react";
import {
  createElementHook,
  createElementObject,
  useLeafletContext,
} from "@react-leaflet/core";
import type { LeafletContextInterface } from "@react-leaflet/core";

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
 * Turn the createRouter function into a hook for the main component.
 */
const useRouter = createElementHook(createRouter);

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

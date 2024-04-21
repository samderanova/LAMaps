import os
from functools import cache

import numpy as np
import osmnx as ox
from pyproj import Proj

import utm

# Miles per 1 degree.

LA_MAP_PATH = os.getenv("LA_MAP_PATH")
if LA_MAP_PATH is None:
    raise Exception("env LA_MAP_PATH required")

@cache
def get_map():
    return ox.load_graphml(LA_MAP_PATH)

mercator_projection = Proj(proj="merc", ellps="WGS84")
def to_mercator(lat: float, lon: float) -> tuple[float, float]:
    return mercator_projection(lon, lat)

def from_mercator(x: float, y: float) -> tuple[float, float]:
    return mercator_projection(x, y, inverse=True)

def scale_and_place(
    coordinates: list[list[int]],
    ne: list[float, float],
    sw: list[float, float],
    y_max_pixels,
    x_max_pixels,
):
    north = ne[0]
    south = sw[0]
    east = ne[1]
    west = sw[1]

    # convert to mercator
    north, east = to_mercator(north, east)
    south, west = to_mercator(south, west)
    
    coords_normalized = [
        (coord[0] / x_max_pixels, 1-coord[1] / y_max_pixels) 
        for coord in coordinates
    ]

    coords_scaled = [
        (
            south + (north - south) * coord[0], 
            west + (east - west) * coord[1]
        )
        for coord in coords_normalized
    ]

    return [
        tuple(reversed(from_mercator(coord[0], coord[1])))
        for coord in coords_scaled
    ]


def fit_to_map(pts: list[tuple[float, float]]):
    '''
    pts: list of lat, lon points 
    '''
    street_graph = get_map()

    utm_pts_np = np.array(
        [
            utm.from_latlon(pt[0], pt[1])[:2]
            for pt in pts
        ]
    )

    utm_pts_metadata = [
        utm.from_latlon(pt[0], pt[1])[2:]
        for pt in pts
    ]

    for _ in range(10):
        # find closes graph nodes to all points
        node_ids = ox.distance.nearest_nodes(street_graph, utm_pts_np[:, 0], utm_pts_np[:, 1])
        err_vectors = np.array([
            [
                street_graph.nodes[node_id]["x"] - utm_pts_np[i, 0],
                street_graph.nodes[node_id]["y"] - utm_pts_np[i, 1]
            ]
            for i, node_id in enumerate(node_ids)
        ])

        # print magnitude of error vectors
        print(utm_pts_np)

        avg_err = np.mean(err_vectors, axis=0)
        utm_pts_np = utm_pts_np + avg_err

    # snap to nearest road
    nearest_nodes = ox.distance.nearest_nodes(street_graph, utm_pts_np[:, 0], utm_pts_np[:, 1])
    utm_pts_np = np.array([
        [street_graph.nodes[node_id]["x"], street_graph.nodes[node_id]["y"]]
        for node_id in nearest_nodes
    ])

    gps_coords = np.array([
        utm.to_latlon(pt[0], pt[1], metadata[0], metadata[1])
        for pt, metadata in zip(utm_pts_np, utm_pts_metadata)
    ])

    return gps_coords

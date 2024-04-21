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

    utm_pts_metadata = [
        utm.from_latlon(pt[0], pt[1])[2:]
        for pt in pts
    ]

    utm_pts_np = np.array(
        [
            utm.from_latlon(pt[0], pt[1])[:2]
            for pt in pts
        ]
    )

    num_seeds = 10

    best_pts = None
    lowest_err = np.inf

    for _seed_no in range(num_seeds):
        # apply random translation, rotation, and scaling
        pts_mean = np.mean(utm_pts_np, axis=0)
        centered_points = utm_pts_np - pts_mean
        rot_degrees = np.random.uniform(-45, 45)
        rot_radians = np.radians(rot_degrees)
        rot_matrix = np.array([
            [np.cos(rot_radians), -np.sin(rot_radians)],
            [np.sin(rot_radians), np.cos(rot_radians)]
        ])
        shape_size = np.max(centered_points, axis=0) - np.min(centered_points, axis=0)
        scale = np.random.uniform(0.9, 1.1, size=2)
        translation = np.random.uniform(-1, 1, size=2) * shape_size

        transformed_points = centered_points * scale @ rot_matrix.T + translation + pts_mean

        for _ in range(10):
            # find closes graph nodes to all points
            node_ids = ox.distance.nearest_nodes(street_graph, transformed_points[:, 0], transformed_points[:, 1])
            err_vectors = np.array([
                [
                    street_graph.nodes[node_id]["x"] - transformed_points[i, 0],
                    street_graph.nodes[node_id]["y"] - transformed_points[i, 1]
                ]
                for i, node_id in enumerate(node_ids)
            ])

            avg_err = np.mean(err_vectors, axis=0)
            
            transformed_points = transformed_points + avg_err
        
        nearest_nodes = ox.distance.nearest_nodes(street_graph, transformed_points[:, 0], transformed_points[:, 1])
        final_err = np.mean(np.linalg.norm(err_vectors, axis=1))
        if final_err < lowest_err:
            best_pts = nearest_nodes
            lowest_err = final_err

    # snap to nearest road
    snapped_utm_points = np.array([
        [street_graph.nodes[node_id]["x"], street_graph.nodes[node_id]["y"]]
        for node_id in best_pts
    ])

    gps_coords = np.array([
        utm.to_latlon(pt[0], pt[1], metadata[0], metadata[1])
        for pt, metadata in zip(snapped_utm_points, utm_pts_metadata)
    ])

    return gps_coords

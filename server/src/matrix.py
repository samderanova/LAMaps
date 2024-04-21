import os
from functools import cache

import numpy as np
import osmnx as ox
from pyproj import Proj

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




def get_loss_matrix(matrix):
    G = get_map()

    lats = matrix[:, 0].tolist()
    lons = matrix[:, 1].tolist()

    node_ids = ox.distance.nearest_nodes(G, lats, lons)
    nodes = G.nodes

    loss_matrix = []
    for i, node_id in enumerate(node_ids):
        node = nodes[node_id]
        lat = node["y"] - matrix[i, 0]
        lon = node["x"] - matrix[i, 1]
        loss_matrix.append(np.array([lat, lon]))

    return np.stack(loss_matrix)


def get_loss_vector(loss_matrix):
    return np.sum(loss_matrix, axis=0)


def get_total_loss(loss_matrix):
    total_loss = 0
    for vector in loss_matrix:
        total_loss += np.linalg.norm(vector)
    return total_loss


def fit_to_map(matrix):
    total_loss_per_iter = []
    for _ in range(40):
        loss_matrix = get_loss_matrix(matrix)
        total_loss = get_total_loss(loss_matrix)
        total_loss_per_iter.append(total_loss)

        vector = get_loss_vector(loss_matrix)
        matrix = matrix + vector * 0.1

    return matrix, total_loss_per_iter


def get_distance_miles(lat, lon):
    G = get_map()
    node_id = ox.distance.nearest_nodes(
        G,
        lat,
        lon,
    )
    nodes = G.nodes()
    node = nodes[node_id]
    closest_lat, closest_lon = node["lat"], node["lon"]
    return (lat - closest_lat) * 69, (lon - closest_lon) * 54.6

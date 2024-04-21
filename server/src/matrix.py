import os
from functools import cache

import numpy as np
import osmnx as ox

# Miles per 1 degree.

LA_MAP_PATH = os.getenv("LA_MAP_PATH")
if LA_MAP_PATH is None:
    raise Exception("env LA_MAP_PATH required")


@cache
def get_map():
    return ox.load_graphml(LA_MAP_PATH)


def scale_and_place(
    coordinates: list[list[int]],
    ne: list[float, float],
    sw: list[float, float],
    y_max_pixels: int = 400,
    x_max_pixels: int = 400,
):
    north = ne[0]
    south = sw[0]
    east = ne[1]
    west = sw[1]

    matrix = np.array(coordinates, dtype=np.float64)
    origin = np.array(south, west)

    lat_multiplier = (north - south) / y_max_pixels
    lon_multiplier = (east - west) / x_max_pixels

    matrix[:, 0] = matrix[:, 0] * lat_multiplier
    matrix[:, 1] = matrix[:, 1] * lon_multiplier
    matrix = matrix + origin

    return matrix


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

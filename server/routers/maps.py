from functools import cache

import numpy as np
import osmnx as ox
from fastapi import APIRouter, status

router = APIRouter()

# 1 Degree Lon Lat to Quarter Mile
SCALING_FACTOR = 0.0036231884


@cache
def get_map():
    return ox.load_graphml("./LA.graphml")


def scale_and_place(coordinates: list[list[int]], starting_point: tuple[float, float]):
    matrix = np.array(coordinates)
    start_array = np.array(starting_point)

    matrix = matrix * SCALING_FACTOR
    matrix = matrix + start_array

    return matrix


def get_loss_matrix(matrix):
    G = get_map()

    lons = matrix[:, 0].tolist()
    lats = matrix[:, 1].tolist()

    node_ids = ox.distance.nearest_nodes(G, lons, lats)
    nodes = G.nodes()

    loss_matrix = []
    for i, node_id in enumerate(node_ids):
        node = nodes[node_id]
        lon = node["y"] - matrix[i, 1]
        lat = node["x"] - matrix[i, 0]
        loss_matrix.append(np.array([lon, lat]))

    return np.stack(loss_matrix)


def get_total_loss(loss_matrix):
    total_loss = 0
    for vector in loss_matrix:
        total_loss += np.linalg.norm(vector)
    return total_loss


@router.post("/coordinates", status_code=status.HTTP_201_CREATED)
async def coordinate(coordinates: list[list[int]], starting_point: tuple[float, float]):
    return scale_and_place(coordinates, starting_point).tolist()


@router.post("/fit", status_code=status.HTTP_201_CREATED)
async def fit(coordinates: list[list[int]], starting_point: tuple[float, float]):
    matrix = scale_and_place(coordinates, starting_point)
    loss_matrix = get_loss_matrix(matrix)
    total_loss = get_total_loss(loss_matrix)
    print(total_loss)
    return loss_matrix.tolist()

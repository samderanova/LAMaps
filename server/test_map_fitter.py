import os
CURRENT_FILE_PATH = os.path.dirname(os.path.abspath(__file__))
os.chdir(CURRENT_FILE_PATH)
from dotenv import load_dotenv
load_dotenv()
from src.matrix import get_map
from make_gpx import make_gpx
import osmnx as ox
import utm
import numpy as np

street_graph = get_map()

pts = [
    [34.069578, -118.433760],
    [34.069824, -118.432808],
    [34.069402, -118.432114],
    [34.069192, -118.432934]
]

# make before gpx
before_gpx = make_gpx(pts)
with open("before.gpx", "w") as f:
    f.write(before_gpx)

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

gpx = make_gpx(gps_coords.tolist())
with open("test.gpx", "w") as f:
    f.write(gpx)
import json
from typing import Annotated

import cv2 as cv
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile
from img_to_points import points_from_img
from make_gpx import b64encode, make_gpx
from src.matrix import fit_to_map, scale_and_place

router = APIRouter()

@router.post("/coordinatize")
async def img_to_points(
    bounds: Annotated[str, Form(...)],
    max_points: Annotated[str, Form(...)] = 50,
    image: UploadFile = File(optional=True),
    snap: Annotated[str, Form(...)] = 'false',
):
    bounds_dict = json.loads(bounds)
    north = bounds_dict["_northEast"]["lat"]
    south = bounds_dict["_southWest"]["lat"]
    east = bounds_dict["_northEast"]["lng"]
    west = bounds_dict["_southWest"]["lng"]
    cv_img = cv.imdecode(
        np.fromstring(image.file.read(), np.uint8), cv.IMREAD_UNCHANGED
    )
    points = points_from_img(cv_img, int(max_points))
    gps_coords = scale_and_place(points, [north, east], [south, west], cv_img.shape[0], cv_img.shape[1])

    if snap == "true":
        gps_coords_ndarray, _ = fit_to_map(gps_coords)
        gps_coords = gps_coords_ndarray.tolist()

    gpx_file = make_gpx(gps_coords)

    return {"points": gps_coords, "gpxFile": b64encode(gpx_file)}

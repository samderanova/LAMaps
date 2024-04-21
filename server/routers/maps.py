import json
from typing import Annotated

import cv2 as cv
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile, status
from img_to_points import points_from_img
from make_gpx import b64encode, make_gpx
from pydantic import BaseModel
from src.matrix import fit_to_map, get_distance_miles, scale_and_place

router = APIRouter()


class Coordinate(BaseModel):
    latitude: float
    longitude: float


@router.post("/fit", status_code=status.HTTP_201_CREATED)
async def fit(coordinates: list[list[float]], starting_point: tuple[float, float]):
    matrix = scale_and_place(coordinates, starting_point)

    matrix, loss_curve = fit_to_map(matrix)

    return {"coordinates": matrix.tolist(), "loss_curve": loss_curve}


@router.post("/distance", status_code=status.HTTP_201_CREATED)
async def distance(lat: float, lon: float):
    return get_distance_miles(lat, lon)


@router.post("/latlon", status_code=status.HTTP_200_OK)
async def process_coords(coordinate: Coordinate) -> Coordinate:
    return Coordinate.model_validate(
        {"latitude": coordinate.latitude, "longitude": coordinate.longitude}
    )


@router.get("/image", status_code=status.HTTP_200_OK)
async def get_coords_from_image() -> list[Coordinate]:
    points = [
        {"latitude": 34.34, "longitude": -117.234},
        {"latitude": 34.24, "longitude": -117.334},
    ]
    return [Coordinate.model_validate(p) for p in points]


@router.post("/coordinatize")
async def img_to_points(
    bounds: Annotated[str, Form(...)],
    max_points: Annotated[str, Form(...)] = 50,
    image: UploadFile = File(optional=True),
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
    gps_coords = scale_and_place(points, north, south, east, west)
    gpx_file = make_gpx(gps_coords)

    return {"points": gps_coords, "gpxFile": b64encode(gpx_file)}

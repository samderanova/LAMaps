from fastapi import APIRouter, status, Form, UploadFile, File
from typing import Annotated
from pydantic import BaseModel

from src.matrix import fit_to_map, get_distance_miles, scale_and_place
from make_gpx import make_gpx, b64encode
from img_to_points import points_from_img
import json
import cv2 as cv
import numpy as np

router = APIRouter()

# Quarter Mile
SCALING_FACTOR = 0.0036231884


class Coordinate(BaseModel):
    latitude: float
    longitude: float


def coordinate(
    coordinates: list[list[float]], starting_point: tuple[float, float]
):
    return scale_and_place(coordinates, starting_point).tolist()


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
async def img_to_points(latitude: Annotated[str, Form(...)], longitude: Annotated[str, Form(...)], bounds: Annotated[str, Form(...)], max_points: Annotated[str, Form(...)]=50, image: UploadFile = File(optional=True)):
    bounds_dict = json.loads(bounds)
    max_lon = bounds_dict["_southWest"]["lon"]
    min_lon = bounds_dict["_northEast"]["lon"]
    max_lat = bounds_dict["_northEast"]["lat"]
    min_lat = bounds_dict["_southWest"]["lat"]
    cv_img = cv.imdecode(np.fromstring(image.file.read(), np.uint8), cv.IMREAD_UNCHANGED)
    points = points_from_img(cv_img, int(max_points))
    starting_pt = (float(latitude), float(longitude))
    gps_coords = coordinate(points, starting_pt)
    gpx_file = make_gpx(gps_coords)

    return {
        "points": gps_coords,
        "gpxFile": b64encode(gpx_file)
    }
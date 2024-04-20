import numpy as np
from fastapi import APIRouter, status, Form, File, UploadFile
from typing import Annotated
from pydantic import BaseModel
import cv2 as cv
import numpy as np
from img_to_points import points_from_img

router = APIRouter()

# Quarter Mile
SCALING_FACTOR = 0.0036231884


class Coordinate(BaseModel):
    latitude: float
    longitude: float


def coordinate(coordinates: list[tuple[int,int]], starting_point: tuple[float, float]):
    matrix = np.array(coordinates)
    start_array = np.array(starting_point)

    matrix = matrix * SCALING_FACTOR
    matrix = matrix + start_array

    return matrix.tolist()


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
async def img_to_points(latitude: Annotated[str, Form(...)], longitude: Annotated[str, Form(...)], image: UploadFile = File(optional=True),):
    cv_img = cv.imdecode(np.fromstring(image.file.read(), np.uint8), cv.IMREAD_UNCHANGED)
    points = points_from_img(cv_img)
    starting_pt = (float(latitude), float(longitude))
    gps_coords = coordinate(points, starting_pt)

    return {
        "points": gps_coords
    }
import numpy as np
from fastapi import APIRouter, status
from pydantic import BaseModel

router = APIRouter()

# Quarter Mile
SCALING_FACTOR = 0.0036231884


class Coordinate(BaseModel):
    latitude: float
    longitude: float


@router.post("/coordinates", status_code=status.HTTP_201_CREATED)
async def coordinate(coordinates: list[list[int]], starting_point: tuple[float, float]):
    matrix = np.array(coordinates)
    start_array = np.array(starting_point)

    matrix = matrix * SCALING_FACTOR
    matrix = matrix + start_array

    return matrix.tolist()


@router.post("/latlon", status_code=status.HTTP_200_OK)
async def process_coords(coordinate: Coordinate) -> dict[str, float]:
    return {"latitude": coordinate.latitude, "longitude": coordinate.longitude}


@router.get("/image", status_code=status.HTTP_200_OK)
async def get_coords_from_image() -> list[Coordinate]:
    points = [
        {"latitude": 34.34, "longitude": -117.234},
        {"latitude": 34.24, "longitude": -117.334},
    ]
    return [Coordinate.model_validate(p) for p in points]

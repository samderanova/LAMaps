from fastapi import APIRouter, status
from pydantic import BaseModel

from src.matrix import fit_to_map, get_distance_miles, scale_and_place

router = APIRouter()

# Quarter Mile
SCALING_FACTOR = 0.0036231884


class Coordinate(BaseModel):
    latitude: float
    longitude: float


@router.post("/coordinates", status_code=status.HTTP_201_CREATED)
async def coordinate(
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

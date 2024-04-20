from fastapi import APIRouter, status

from src.matrix import fit_to_map, get_distance_miles, scale_and_place

router = APIRouter()


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

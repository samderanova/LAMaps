import numpy as np
from fastapi import APIRouter, status

router = APIRouter()

# Quarter Mile
SCALING_FACTOR = 0.0036231884


@router.post("/coordinates", status_code=status.HTTP_201_CREATED)
async def coordinate(coordinates: list[list[int]], starting_point: tuple[float, float]):
    matrix = np.array(coordinates)
    start_array = np.array(starting_point)

    matrix = matrix * SCALING_FACTOR
    matrix = matrix + start_array

    return matrix.tolist()

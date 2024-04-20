from fastapi import FastAPI
from routers import maps

app = FastAPI()


app.include_router(maps.router, prefix="/maps")


def generate_points(text: str):
    """
    Generate points in 2d that if traced would draw out `text`. Returns a list of float tuples. The scale is such that each line of text is ~1 unit tall
    """

    return [(0, 0), (1, 0), (1, 1), (0, 1)]


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "hello"}

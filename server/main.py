from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from hard_coded_text_pts import text_pts
import cv2 as cv
import numpy as np
from img_to_points import points_from_img
from routers import maps

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(maps.router, prefix="/maps")


def generate_points(text: str):
    """
    Generate points in 2d that if traced would draw out `text`. Returns a list of float tuples. The scale is such that each line of text is ~1 unit tall
    """

    # convert to uppercase
    pts = []
    for i, char in enumerate(text.upper()):
        if char == " ":
            continue
        shifted_pts = [(x + i, y) for x, y in text_pts[char]]
        pts.extend(shifted_pts)
    return pts

@app.post("/img_to_points")
async def img_to_points(file: UploadFile = File(...)) -> list[tuple[float, float]]:
    """
    Converts an image to a list of points that can be used to draw the image
    """
    # read image
    contents = await file.read()
    img = cv.imdecode(np.frombuffer(contents, np.uint8), cv.IMREAD_COLOR)
    points = img_to_points(img)
    return points


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "hello"}

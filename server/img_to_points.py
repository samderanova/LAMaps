import cv2 as cv
import numpy as np
from itertools import pairwise
import os

CURRENT_FILEPATH = os.path.dirname(os.path.abspath(__file__))

def _combine_contours(contours: list[list[tuple[int, int]]]) -> list[tuple[int, int]]:
    """
    Combines multiple contours into a single contour
    """
    centroids = [np.mean(contour, axis=0) for contour in contours]
    # order contours by x coordinate of centroids
    sorted_contours = [
        contour
        for _, contour in sorted(zip(centroids, contours), key=lambda x: x[0][0][0])
    ]

    contours_rotated = []
    for contour in sorted_contours:
        max_y_index = max(range(len(contour)), key=lambda i: contour[i][0][0]+contour[i][0][1])
        contours_rotated.append(np.roll(contour, -max_y_index, axis=0))

    # combine contours
    combined = np.concatenate(contours_rotated).tolist()

    return combined

def points_from_img(img: cv.Mat) -> list[tuple[int, int]]:
    """
    Returns a list of points from an rgb image
    """
    gray = cv.cvtColor(img, cv.COLOR_BGR2GRAY)
    contours, _ = cv.findContours(gray, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    combined_contours = _combine_contours([contour.tolist() for contour in contours])

    return combined_contours

if __name__ == "__main__":
    img = cv.imread(f"{CURRENT_FILEPATH}/stick_and_triangle.png")
    combined_contours = points_from_img(img)
    
    for c1, c2 in pairwise(combined_contours):
        rand_color = np.random.randint(0, 255, 3).tolist()
        cv.line(img, tuple(c1[0]), tuple(c2[0]), rand_color, 2)

    cv.imshow("contours", img)
    cv.waitKey(0)

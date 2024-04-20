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

def points_from_img(img: cv.Mat, points_limit: int = 200) -> list[tuple[int, int]]:
    """
    Returns a list of points from an rgb image
    """
    gray = cv.cvtColor(img, cv.COLOR_BGR2GRAY)
    contours, _ = cv.findContours(gray, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    combined_contours = _combine_contours([contour.tolist() for contour in contours])

    if len(combined_contours) <= points_limit:
        return combined_contours

    neighbor_distances = [
        np.linalg.norm(np.array(p1) - np.array(p2))
        for p1, p2 in pairwise(combined_contours)
    ]

    # TODO: also consider curvature of points to cull. We can get
    # a rough approximation of curvature by looking at the angle between
    # the vectors going into and out of the point

    taken_indices = set()

    while len(taken_indices) < points_limit:
        max_distance_index = np.argmax(neighbor_distances)
        if max_distance_index in taken_indices:
            neighbor_distances[max_distance_index] = 0
            continue

        taken_indices.add(max_distance_index)
        neighbor_distances[max_distance_index] = 0

    filtered_contours = []
    for i in range(len(combined_contours)):
        if i in taken_indices:
            filtered_contours.append(combined_contours[i])

    return filtered_contours

if __name__ == "__main__":
    img = cv.imread(f"{CURRENT_FILEPATH}/stick_and_triangle.png")
    combined_contours = points_from_img(img)
    
    for c1, c2 in pairwise(combined_contours):
        rand_color = np.random.randint(0, 255, 3).tolist()
        cv.line(img, tuple(c1[0]), tuple(c2[0]), rand_color, 2)

    cv.imshow("contours", img)
    cv.waitKey(0)

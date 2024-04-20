import cv2 as cv
from collections import defaultdict
import numpy as np
from itertools import pairwise
import os
import sys
sys.setrecursionlimit(int(1e6))

CURRENT_FILEPATH = os.path.dirname(os.path.abspath(__file__))

def skeletonize(img: cv.Mat) -> cv.Mat:
    """
    Skeletonizes an rgb image
    """
    img = cv.cvtColor(img, cv.COLOR_BGR2GRAY)
    img = cv.ximgproc.thinning(img)
    return img


def sectionize(img: cv.Mat):
    skeleton = skeletonize(img)

    sections = defaultdict(list)
    last_section_index = 0
    visited = set()

    def neighbors(x,y):
        return [(x-1,y), (x+1,y), (x,y-1), (x,y+1), (x-1,y-1), (x-1,y+1), (x+1,y-1), (x+1,y+1)]

    def dfs(start_x,start_y,start_section_index):
        exploration = [(start_x, start_y, start_section_index)]
        while len(exploration) > 0:
            x,y,section_index = exploration.pop(0)
            sections[section_index].append((y,x))
            nonlocal last_section_index
            num_nonzero_aa_neighbors = sum( # aa = axis aligned (no diagonals)
                1 for nx, ny in neighbors(x, y)[:4]
                if 0 <= nx < skeleton.shape[0] and 0 <= ny < skeleton.shape[1] and skeleton[nx, ny] > 0
            )

            for nx, ny in neighbors(x, y):
                in_bounds = 0 <= nx < skeleton.shape[0] and 0 <= ny < skeleton.shape[1]
                not_visited = (nx, ny) not in visited
                if not (in_bounds and not_visited and skeleton[nx, ny] > 0):
                    continue

                visited.add((nx, ny))
                if num_nonzero_aa_neighbors > 2:
                    print("!!")
                    last_section_index+=1
                    exploration.append([nx, ny, last_section_index])
                else:
                    exploration.append([nx, ny, section_index])
    
    for x in range(skeleton.shape[0]):
        for y in range(skeleton.shape[1]):
            if skeleton[x, y] > 0 and (x, y) not in visited:
                visited.add((x, y))
                dfs(x, y, last_section_index)

    return sections.values()    

def linearize_section(section: list[tuple[int, int]], angle_threshold: float) -> list[tuple[int, int]]:
    if len(section) < 5:
        return section
    reduced_section = [
        section[0], section[1]
    ]
    for i in range(len(section))[2:-2]:
        prev = section[i-2]
        curr = section[i]
        next = section[i+2]
        angle = np.arctan2(curr[1] - prev[1], curr[0] - prev[0]) - np.arctan2(next[1] - curr[1], next[0] - curr[0])
        if angle < angle_threshold:
            reduced_section.append(curr)
    reduced_section.extend(section[-2:])
    return reduced_section

def reduce_sections(sections: list[list[tuple[int, int]]], points_limit: int) -> list[tuple[int, int]]:
    # binary search to find angle threshold that hits point limit exactly
    # increasing the threshold will increase the number of points
    lo = 0
    hi = 90
    for i in range(10):
        angle_threshold = (lo + hi) / 2
        sections = [linearize_section(section, angle_threshold) for section in sections]
        n_points = sum(len(section) for section in sections)
        if n_points  < points_limit:
            # too few points, increase threshold
            lo = angle_threshold
        elif n_points > points_limit:
            hi = angle_threshold
        else:
            break
    return sections
    

def points_from_img(img: cv.Mat, points_limit: int = 200) -> list[tuple[int, int]]:
    """
    Returns a list of points from an rgb image
    """
    pass
    

    
    
        

            


if __name__ == "__main__":
    img = cv.imread(f"{CURRENT_FILEPATH}/car.png")

    skeleton = skeletonize(img) 

    # skeletonize and imshow
    sections = sectionize(img)
    reduced_sections = reduce_sections(sections, 200)
    palette = np.random.randint(0, 255, (len(sections), 3)).tolist()
    canvas = np.zeros_like(img, dtype=np.uint8)
    canvas2 = np.zeros_like(img, dtype=np.uint8)
    for i, section in enumerate(sections):
        for (y1,x1), (y2,x2) in pairwise(reduced_sections[i]):
            cv.line(canvas, (y1, x1), (y2, x2), palette[i], 2)
        for y,x in section:
            canvas2[x, y] = palette[i]

    cv.imshow("original", img)
    cv.imshow("lines", canvas)
    cv.imshow("skeleton", canvas2)
    # if q, exit
    while cv.waitKey(1) != ord('q'):
        pass


    # combined_contours = points_from_img(img)
    
    # for c1, c2 in pairwise(combined_contours):
    #     rand_color = np.random.randint(0, 255, 3).tolist()
    #     cv.line(img, tuple(c1[0]), tuple(c2[0]), rand_color, 2)

    # cv.imshow("contours", img)
    # cv.waitKey(0)

import cv2 as cv
from collections import defaultdict
import numpy as np
from itertools import combinations, product
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
    def dfs(x,y,section_index):
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
                last_section_index+=1
                dfs(nx, ny, last_section_index)
            else:
                dfs(nx, ny, section_index)
    
    for x in range(skeleton.shape[0]):
        for y in range(skeleton.shape[1]):
            if skeleton[x, y] > 0 and (x, y) not in visited:
                visited.add((x, y))
                dfs(x, y, last_section_index)


    # redo a bfs starting with leftmost point to make sure no lines cross within a section
    reordered_sections = []
    for section in sections.values():
        new_section = []
        # find point with only 1 neighbor
        first_point = min(
            section,
            key=lambda p: sum(1 for nx, ny in neighbors(p[0], p[1]) if (nx, ny) in section)
        )
        exploration = [first_point]
        section_visited = set()
        while len(exploration) > 0:
            x, y = exploration.pop(0)
            if (x, y) in section_visited:
                continue
            new_section.append((x, y))
            section_visited.add((x, y))
            for nx, ny in neighbors(x, y):
                if (nx, ny) in section and (nx, ny) not in section_visited:
                    exploration.append((nx, ny))
        reordered_sections.append(new_section)

    return reordered_sections

def linearize_section(section: list[tuple[int, int]], mse_threshold: float) -> list[tuple[int, int]]:
    reduced_section = [section[0]]
    last_added = 0
    for i in range(1, len(section)-1):
        # compute MSE for points last_added:i from linear approximation
        prev_x, prev_y = section[last_added]
        x, y = section[i]
        if prev_x == x:
            continue
        a = (y - prev_y) / (x - prev_x)
        b = prev_y - a * prev_x
        err = np.mean([(a*x + b - y)**2 for x, y in section[last_added:i]])
        if err >= mse_threshold:
            reduced_section.append(section[i])
            last_added = i
    reduced_section.append(section[-1])

    return reduced_section

def reduce_sections(sections: list[list[tuple[int, int]]], points_limit: int) -> list[tuple[int, int]]:
    # binary search to find angle threshold that hits point limit exactly
    # increasing the threshold will increase the number of points
    lo = 0
    hi = 10
    for i in range(100):
        mse_threshold = (lo + hi) / 2
        linearized_sections = [linearize_section(section, mse_threshold) for section in sections]
        n_points = sum(len(section) for section in linearized_sections)
        if n_points  < points_limit:
            hi = mse_threshold
        elif n_points > points_limit:
            lo = mse_threshold
        else:
            break
    return linearized_sections
    

def make_graph(img: cv.Mat, points_limit: int = 200) -> tuple[list[tuple[int, int]], dict[int, list[int]]]:
    """
    Returns a list of points from an rgb image
    """
    sections = sectionize(img)
    reduced_sections = reduce_sections(sections, points_limit)

    vertices = []
    adjacencies = defaultdict(list)
    global_indices = dict()
    for section in reduced_sections:
        for i in range(len(section)):
            global_indices[(section[i])] = len(vertices)
            vertices.append(section[i])
            if i > 0:
                adjacencies[global_indices[section[i]]].append(global_indices[section[i-1]])
                adjacencies[global_indices[section[i-1]]].append(global_indices[section[i]])
    
    for s1, s2 in combinations(reduced_sections, 2):
        # check if endpoints are close, if so add edges
        for i,j in product([0,-1],[0,-1]):
            if np.linalg.norm(np.array(s1[i]) - np.array(s2[j])) < 10:
                adjacencies[global_indices[s1[i]]].append(global_indices[s2[j]])
                adjacencies[global_indices[s2[j]]].append(global_indices[s1[i]])
        
    return vertices, adjacencies

def points_from_img(img: cv.Mat) -> list[tuple[int, int]]:
    pass

if __name__ == "__main__":
    img = cv.imread(f"{CURRENT_FILEPATH}/car.png")
    canvas = np.zeros_like(img)

    vertices, adjacencies = make_graph(img)
    for i, j in adjacencies.items():
        for k in j:
            rand_color = np.random.randint(0, 255, 3).tolist()
            cv.line(canvas, vertices[i], vertices[k], rand_color, 2)

    sections_canvas = np.zeros_like(img)
    sections = sectionize(img)
    for section in sections:
        rand_color = np.random.randint(0, 255, 3).tolist()
        for x,y in section:
            cv.line(sections_canvas, (x,y), (x,y), rand_color, 1)
    
    cv.imshow("img", img)
    cv.imshow("sections", sections_canvas) 
    cv.imshow("graph", canvas)
    # if q, exit
    while cv.waitKey(1) != ord('q'):
        pass


    # combined_contours = points_from_img(img)
    
    # for c1, c2 in pairwise(combined_contours):
    #     rand_color = np.random.randint(0, 255, 3).tolist()
    #     cv.line(img, tuple(c1[0]), tuple(c2[0]), rand_color, 2)

    # cv.imshow("contours", img)
    # cv.waitKey(0)

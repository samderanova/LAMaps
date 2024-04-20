import cv2 as cv
from collections import defaultdict
import numpy as np
from itertools import combinations, product, pairwise
import os
import sys
from chinese_postman import chinese_postman_problem
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
        all_neighbors = [(x-1,y), (x+1,y), (x,y-1), (x,y+1), (x-1,y-1), (x-1,y+1), (x+1,y-1), (x+1,y+1)]
        return [
            (nx, ny) for nx, ny in all_neighbors
        ]

    def is_intersection(x,y):
        neighbor_diffs = [
            (nx-x, ny-y) for nx, ny in neighbors(x, y) if 0 <= nx < skeleton.shape[0] and 0 <= ny < skeleton.shape[1] and skeleton[nx, ny] > 0
        ]

        # for every subset of 3
        for v1, v2, v3 in combinations(neighbor_diffs, 3):
            # if all 3 are orthogonal or opposite, return true
            if all([
                np.dot(v1, v2) <= 0,
                np.dot(v1, v3) <= 0,
                np.dot(v2, v3) <= 0
            ]):
                return True
        return False

    def dfs(x,y,section_index):
        sections[section_index].append((y,x))
        nonlocal last_section_index

        for nx, ny in neighbors(x, y):
            in_bounds = 0 <= nx < skeleton.shape[0] and 0 <= ny < skeleton.shape[1]
            not_visited = (nx, ny) not in visited
            if not (in_bounds and not_visited and skeleton[nx, ny] > 0):
                continue

            visited.add((nx, ny))
            if is_intersection(x, y):
                last_section_index+=1
                dfs(nx, ny, last_section_index)
            else:
                dfs(nx, ny, section_index)
    
    for x in range(skeleton.shape[0]):
        for y in range(skeleton.shape[1]):
            if skeleton[x, y] > 0 and (x, y) not in visited:
                visited.add((x, y))
                dfs(x, y, last_section_index)
                last_section_index+=1

    # redo a bfs starting with leftmost point to make sure no lines cross within a section
    reordered_sections = []
    for section in sections.values():
        section_set = set(section)
        new_section = []
        # find point with only 1 neighbor
        first_point = min(
            section,
            key=lambda p: len([p2 for p2 in neighbors(*p) if p2 in section_set])
        )
        exploration = [first_point]
        section_visited = set()
        x, y = first_point
        while len(exploration) > 0:
            # get point in exploration with least distance to last point
            i = np.argmin([np.linalg.norm(np.array(p) - np.array((x, y))) for p in exploration])
            x, y = exploration.pop(i)
            if (x, y) in section_visited:
                continue
            new_section.append((x, y))
            section_visited.add((x, y))
            for nx, ny in neighbors(x, y):
                if (nx, ny) in section_set and (nx, ny) not in section_visited:
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
    

def make_graph(img: cv.Mat, points_limit: int = 50) -> tuple[list[tuple[int, int]], dict[int, list[int]]]:
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
            global_indices[section[i]] = len(vertices)
            vertices.append(section[i])
            if i > 0:
                adjacencies[global_indices[section[i]]].append(global_indices[section[i-1]])
                adjacencies[global_indices[section[i-1]]].append(global_indices[section[i]])
    
    for s1, s2 in combinations(reduced_sections, 2):
        # check if endpoints are close, if so add edges
        for i,j in product([0,-1],[0,-1]):
            if np.linalg.norm(np.array(s1[i]) - np.array(s2[j])) < 5:
                adjacencies[global_indices[s1[i]]].append(global_indices[s2[j]])
                adjacencies[global_indices[s2[j]]].append(global_indices[s1[i]])

    return vertices, adjacencies

def connected_components(vertices: list[tuple[int, int]], adjacencies: dict[int, list[int]]) -> list[list[int]]:
    '''
    Returns components as lists of vertex indices
    '''
    visited = set()
    components = []
    for i in range(len(vertices)):
        if i in visited or len(adjacencies[i]) == 0:
            continue
        exploration = [i]
        component = []
        while len(exploration) > 0:
            cur = exploration.pop()
            if cur in visited: continue
            visited.add(cur)
            component.append(cur)
            for neighbor in adjacencies[cur]:
                exploration.append(neighbor)
        components.append(component)
    return components 

def combine_components(components: list[list[int]], vertices: list[tuple[int,int]], adjacencies: dict[int, list[int]]) -> list[list[int]]:
    '''
    Return new adjacency list with components combined
    '''

    left_right_components = sorted(components, key=lambda c: np.mean([vertices[i][0] for i in c]))
    # copy adjacencies
    new_adjacencies = { i: adjacencies[i].copy() for i in range(len(vertices))}

    for c1, c2 in pairwise(left_right_components):
        # connect bottom-right of c1 to bottom-left of c2
        c1_bot_right = max(c1, key=lambda i: vertices[i][1]+vertices[i][0])
        c2_bot_left = min(c2, key=lambda i: vertices[i][0]-vertices[i][1])

        new_adjacencies[c1_bot_right].append(c2_bot_left)
        new_adjacencies[c2_bot_left].append(c1_bot_right)
    
    return new_adjacencies

def create_weighted_edgelist(vertices: list[tuple[int, int]], adjacencies: dict[int, list[int]]) -> list[tuple[int, int, float]]:
    '''
    Create undirected edge list with weights (no duplicates from adjacency list)
    '''
    edges_dict = dict()
    for i, neighbors in adjacencies.items():
        for j in neighbors:
            # sort to guarantee no duplicates
            edges_dict[tuple(sorted((i, j)))] = np.linalg.norm(np.array(vertices[i]) - np.array(vertices[j]))
    return [(i, j, w) for (i, j), w in edges_dict.items()]

def points_from_img(img: cv.Mat, max_points: int = 50) -> list[tuple[int, int]]:
    vertices, adjacencies = make_graph(img, points_limit=max_points)
    components = connected_components(vertices, adjacencies)
    combined_adjacency = combine_components(components, vertices, adjacencies)
    edge_list = create_weighted_edgelist(vertices, combined_adjacency)
    vertex_order = chinese_postman_problem(edge_list) 
    
    return [
        vertices[i] for i in vertex_order
    ]

if __name__ == "__main__":
    img = cv.imread(f"{CURRENT_FILEPATH}/debugging/car.png")
    canvas = np.zeros_like(img)

    for v1, v2 in pairwise(points_from_img(img)):
        cv.line(canvas, v1, v2, (0, 255, 0), 2)
        cv.imshow("canvas", canvas)
        cv.waitKey(10)

    # if q, exit
    while cv.waitKey(1) != ord('q'):
        pass


    # combined_contours = points_from_img(img)
    
    # for c1, c2 in pairwise(combined_contours):
    #     rand_color = np.random.randint(0, 255, 3).tolist()
    #     cv.line(img, tuple(c1[0]), tuple(c2[0]), rand_color, 2)

    # cv.imshow("contours", img)
    # cv.waitKey(0)

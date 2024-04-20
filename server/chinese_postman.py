import networkx as nx
from postman_problems.solver import cpp
# use my fork: https://github.com/EricPedley/postman_problems


def chinese_postman_problem(edge_list: list[tuple[int,int,float]], start: int = 0):
    '''
    Returns vertex indices in order of traversal for a chinese postman circuit
    '''
    G = nx.MultiGraph()
    for i,e in enumerate(edge_list):
        G.add_edge(e[0], e[1], distance=e[2], id=i)
    circuit, graph = cpp(G, start_node=start)
    return [e[0] for e in circuit] + [circuit[0][0]]

if __name__ == "__main__":
    edge_list = [(0, 1, 1), (1, 2, 1), (0,2, 1), (2, 3, 1)]
    print(chinese_postman_problem(edge_list, 1))

import pygame

# Define window size
window_width = 400

# Initialize Pygame
pygame.init()

# Create the window
screen = pygame.display.set_mode((window_width, window_width))

# Set window title
pygame.display.set_caption("Scaled Lines from Points")

# Define line color
line_color = (0, 0, 255)  # Blue for lines

# Define points list (replace with your desired points)
from main import generate_points
points  = generate_points("LA HACKS")

def scale_points(points, window_width):
    """Scales points to fit the entire window width."""
    # Find the maximum x and y values
    max_x = max(point[0] for point in points)
    max_y = max(point[1] for point in points)

    # Calculate scaling factor
    scale_factor = min(window_width / max_x, window_width / max_y)

    # Scale and return the points
    return [
        (int(point[0] * scale_factor), int(point[1] * scale_factor)) for point in points
    ]


# Main loop
running = True
while running:
    # Check for events
    for event in pygame.event.get():
        # Quit event
        if event.type == pygame.QUIT:
            running = False

    # Clear the screen (optional)
    # screen.fill((255, 255, 255))

    # Get scaled points
    scaled_points = scale_points(points.copy(), window_width)

    # Draw lines pairwise
    for i in range(len(scaled_points) - 1):
        start_pos = scaled_points[i]
        end_pos = scaled_points[i + 1]
        pygame.draw.line(screen, line_color, start_pos, end_pos)

    # Update the display
    pygame.display.flip()

# Quit Pygame
pygame.quit()

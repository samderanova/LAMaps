import pygame

# Define window size
window_size = (400, 400)

# Initialize Pygame
pygame.init()

# Create the window
screen = pygame.display.set_mode(window_size)

# Set window title
pygame.display.set_caption("Drawing Lines")

# Define colors
line_color = (0, 0, 255)  # Blue for lines

# Store previous mouse position
prev_mouse_pos = None

# Main loop
running = True
print("[")
while running:
    # Check for events
    for event in pygame.event.get():
        # Quit event
        if event.type == pygame.QUIT:
            running = False

        # Mouse click event
        if event.type == pygame.MOUSEBUTTONDOWN:
            # Get current mouse position
            mouse_x, mouse_y = pygame.mouse.get_pos()

            # Draw line if there's a previous position
            if prev_mouse_pos:
                pygame.draw.line(screen, line_color, prev_mouse_pos, (mouse_x, mouse_y))

            # Update previous position
            prev_mouse_pos = (mouse_x, mouse_y)
            mouse_x /= window_size[0]
            mouse_y /= window_size[1]
            print(f"({mouse_x}, {mouse_y}),")

    # Fill the window with white (optional)
    # screen.fill((255, 255, 255))

    # Update the display
    pygame.display.flip()

print("]")
# Quit Pygame
pygame.quit()

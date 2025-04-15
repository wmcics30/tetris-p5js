# This is a reference, will not be present in the final project.
# This code is my own.

import pygame
import random as rand

# Stores TETROMINO_COLORS used for each of the 7 Tetrominoes
TETROMINO_COLORS = [
    (0, 255, 255),
    (0, 0, 255),
    (255, 127, 0),
    (255, 255, 0),
    (0, 255, 0),
    (128, 0, 128),
    (255, 0, 0)
]

# All non-Tetromino colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRID_GREY = (170, 170, 170)
DEAD_SQUARE_GREY = (120, 120, 120)
YELLOW = (200, 200, 0)

PIECE_LOCK = pygame.USEREVENT + 1
DAS_LEFT = pygame.USEREVENT + 2
DAS_RIGHT = pygame.USEREVENT + 3

class Tetromino:
    '''A Tetris piece.'''
    
    # Each row is a different piece, each column is a different rotation.
    # The numbers represent the spaces each figure occupies on a 5x5 grid (I piece)
    # or a 3x3 grid (every other piece)
    FIGURES = [
            [[11, 12, 13, 14], [7, 12, 17, 22], [10, 11, 12, 13], [2, 7, 12, 17]], # I
            [[0, 3, 4, 5], [1, 2, 4, 7], [3, 4, 5, 8], [1, 4, 6, 7]], # J
            [[2, 3, 4, 5], [1, 4, 7, 8], [3, 4, 5, 6], [0, 1, 4, 7]], # L
            [[1, 2, 4, 5], [4, 5, 7, 8], [3, 4, 6, 7], [0, 1, 3, 4]], # O
            [[1, 2, 3, 4], [1, 4, 5, 8], [4, 5, 6, 7], [0, 3, 4, 7]], # S
            [[1, 3, 4, 5], [1, 4, 5, 7], [3, 4, 5, 7], [1, 3, 4, 7]], # T
            [[0, 1, 4, 5], [2, 4, 5, 7], [3, 4, 7, 8], [1, 3, 4, 6]]  # Z
    ]
    
    # SRS Offset Data table
    JLSTZ_OFFSET_DATA = [
            [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
            [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]
    ]
    
    # SRS Offset Data table
    I_OFFSET_DATA = [
            [[0, 0], [-1, 0], [2, 0], [-1, 0], [2, 0]],
            [[-1, 0], [0, 0], [0, 0], [0, 1], [0, -2]],
            [[-1, 1], [1, 1], [-2, 1], [1, 0], [-2, 0]],
            [[0, 1], [0, 1], [0, 1], [0, -1], [0, 2]]
    ]
    
    # SRS Offset Data table
    O_OFFSET_DATA = [
            [0, 0],
            [0, -1],
            [-1, -1], 
            [-1, 0],
    ]
    
    def __init__(self, source):
        '''Spawns a Tetromino. "source" is either "Hold" or "Queue", which represent where the Tetromino is coming from.'''
            
        if source == "Queue":
            self.type = game.advance_piece_queue()
            
        elif source == "Hold":
            if game.piece_held == None:
                self.type = game.advance_piece_queue()
            else:
                self.type = game.piece_held
                
        self.x = 3
        self.y = 1
        self.rotation = 0
        
        if self.type == 0:
            self.x -= 1
            self.y -= 1
            
        pygame.time.set_timer(PIECE_LOCK, 0)
        self.move_reset_counter = 0
        game.lock_delay = False
        
        if debug:
            print("initialized new Tetromino")
        
    def image(self, rotation_difference = 0):
        '''Returns the piece's shape and orientation. Allows for images to be made with non-true rotations for SRS.'''
        
        return Tetromino.FIGURES[self.type][(self.rotation + rotation_difference) % 4]
    
    def rotate(self, rotation_distance):
        '''Rotates the current active piece using the Super Rotation System.'''

        if self.type == 0:
            self.new_rotation = (self.rotation + rotation_distance) % 4
            
            for i in range(5):
                (self.previous_offset_x, self.previous_offset_y) = Tetromino.I_OFFSET_DATA[self.rotation][i]
                self.new_offset_x, self.new_offset_y = Tetromino.I_OFFSET_DATA[self.new_rotation][i]
                self.x_difference = self.previous_offset_x - self.new_offset_x
                self.y_difference = self.previous_offset_y - self.new_offset_y
                
                if not game.intersects(self.x_difference, self.y_difference, rotation_distance):
                    self.rotation = self.new_rotation
                    self.x += self.x_difference
                    self.y -= self.y_difference
                    break
                
        elif self.type == 3:
            
            (self.previous_offset_x, self.previous_offset_y) = Tetromino.O_OFFSET_DATA[self.rotation]
            self.new_rotation = (self.rotation + rotation_distance) % 4
            (self.new_offset_x, self.new_offset_y) = Tetromino.O_OFFSET_DATA[self.new_rotation]
            self.x_difference = self.previous_offset_x - self.new_offset_x
            self.y_difference = self.previous_offset_y - self.new_offset_y
            
            if not game.intersects(self.x_difference, self.y_difference, rotation_distance):
                self.rotation = self.new_rotation
                self.x += self.x_difference
                self.y -= self.y_difference
                
        else:
            
            self.new_rotation = (self.rotation + rotation_distance) % 4
            
            for i in range(5):
                (self.previous_offset_x, self.previous_offset_y) = Tetromino.JLSTZ_OFFSET_DATA[self.rotation][i]
                self.new_offset_x, self.new_offset_y = Tetromino.JLSTZ_OFFSET_DATA[self.new_rotation][i]
                self.x_difference = self.previous_offset_x - self.new_offset_x
                self.y_difference = self.previous_offset_y - self.new_offset_y
                
                if not game.intersects(self.x_difference, self.y_difference, rotation_distance):
                    self.rotation = self.new_rotation
                    self.x += self.x_difference
                    self.y -= self.y_difference
                    break
                
        if game.lock_delay == True:
            self.move_reset_counter += 1
            pygame.time.set_timer(PIECE_LOCK, 500)

class Tetris:
    '''A game of Tetris.'''
    
    MATRIX_WIDTH = 10
    MATRIX_HEIGHT = 20
    MATRIX_X_OFFSET = 5
    MATRIX_Y_OFFSET = 1.5
    GAME_ZOOM = 20
    
    # The gravity values used. Left column is the amount of frames it takes a piece to fall,
    # right column is the distance it falls. Each row represents a different level.
    GRAVITIES = [
        [60, 1],
        [48, 1],
        [37, 1],
        [28, 1],
        [21, 1],
        [16, 1],
        [11, 1],
        [8, 1],
        [6, 1],
        [4, 1],
        [3, 1],
        [2, 1],
        [1, 1],
        [0.5, 2],
                ]
    
    def __init__(self):
        '''Initializes the game.'''
        
        # Game info - Stats
        self.score = 0
        self.level = 1
        self.total_lines_cleared = 0
        
        # Game info - Other
        self.active_piece = None
        self.piece_held = None
        self.hold_used = False
        self.lock_delay = False
        
        # User input info
        self.hard_dropping = False
        self.soft_dropping = False
        self.do_das_left = False
        self.do_das_right = False
        
        # Create matrix and set game state to active
        self.field = [[0 for j in range(Tetris.MATRIX_WIDTH)] for i in range(Tetris.MATRIX_HEIGHT)]
        self.queue = []
        self.game_active = True
    
    def call_rotation(self, rotation_distance):
        '''Ensures there is an active piece to rotate before calling the self.active_piece.rotate() function.'''
        
        try:
            self.active_piece.rotate(rotation_distance)
        except:
            pass
        
    def __str__(self):
        '''Returns the matrix as a string for testing purposes.'''

        stringed_field = ''
        for i in range(Tetris.MATRIX_HEIGHT):
            for j in range(Tetris.MATRIX_WIDTH):
                stringed_field += str(self.field[i][j])
            stringed_field += "\n"
                           
        return(f"{stringed_field}")
            
    def advance_piece_queue(self):
        '''Refills queue if needed, then removes the first item in the queue and returns it.'''
        
        if len(self.queue) < 6:
            bag = [0, 1, 2, 3, 4, 5, 6]
            rand.shuffle(bag)
            self.queue += bag
    
        new_piece = self.queue[0]
        self.queue.pop(0)
        return(new_piece)
    
    def clear_lines(self):
        '''Clears any row where all spaces are non-empty. Shifts contents of all rows above cleared line down one row.'''
        
        if debug:
            print("Tetris.clear_lines() called")
            
        lines = 0
        for i in range(Tetris.MATRIX_HEIGHT):
            if 0 not in self.field[i]:
                lines += 1
                self.total_lines_cleared += 1
                for i1 in range(i, 1, -1):
                    for j in range(Tetris.MATRIX_WIDTH):
                        self.field[i1][j] = self.field[i1 - 1][j]

                self.field[0] = [0 for i in range(Tetris.MATRIX_WIDTH)]
        
        # Adds to the score based on how many lines were cleared.
        match lines:                
            case 1:
                self.score += 100 * self.level
            case 2:
                self.score += 300 * self.level
            case 3:
                self.score += 500 * self.level
            case 4:
                self.score += 800 * self.level
            case _:
                pass
    
    def hold_piece(self):
        '''Swaps the active piece with the piece in the hold space.'''
        
        if self.active_piece != None and not self.hold_used:
            if debug:
                print("Tetris.hold_piece() called")
            
            self.active_piece, self.piece_held = Tetromino("Hold"), self.active_piece.type
            self.hold_used = True
            self.lock_delay = False
            pygame.time.set_timer(PIECE_LOCK, 0)
            
    def place_piece(self):
        '''Locks a Tetromino into place.'''
        
        if debug:
                print("Tetris.place_piece() called")
        
        # Check to make sure the piece should be placed
        if self.intersects(0, -1, 0) and self.game_active:
            
            # Places each cell of the piece
            self.piece_placement_scan_dimension = self.get_scan_dimension()
            for i in range(self.piece_placement_scan_dimension):
                for j in range(self.piece_placement_scan_dimension):
                    if i * self.piece_placement_scan_dimension + j in self.active_piece.image():
                        self.field[i + self.active_piece.y][j + self.active_piece.x] = self.active_piece.type + 1
                                        
            self.clear_lines()
            
            pygame.time.set_timer(PIECE_LOCK, 0)
            self.lock_delay = False
            
            self.hold_used = False
            self.active_piece = None
        
    def get_scan_dimension(self, piece_state = None, piece_type = None):
        '''Checks if the piece's figure sits inside a 3x3 or a 5x5. Returns the resulting side length.'''
        
        if piece_state == "Active" or piece_state == None:
            if self.active_piece == None:
                return(0)
            
            elif self.active_piece.type == 0:
                return(5)
            
            else:
                return(3)
            
        if piece_state == "Queue" or piece_state == "Hold":
            if piece_type == 0:
                return(5)
            
            if piece_type in [1, 2, 3, 4, 5, 6]:
                return(3)
        
    def move_piece_h(self, dx):
        '''Moves active piece along the X axis.'''
        
        if self.active_piece != None:
            self.active_piece.x += dx
            if self.intersects():
                self.active_piece.x -= dx
                
            if self.lock_delay == True:
                self.active_piece.move_reset_counter += 1
                pygame.time.set_timer(PIECE_LOCK, 500)
            
    def move_piece_down(self):
        '''Moves active piece down 1 space on the Y axis.'''
        
        if self.active_piece != None:
            self.active_piece.y += 1
            
            if self.intersects():
                self.active_piece.y -= 1
                
                # If the player has evaded piece lock 15 times, places the piece.
                if self.active_piece.move_reset_counter >= 15:
                    self.place_piece()
                
                elif game.hard_dropping:
                    self.place_piece()
                    self.hard_dropping = False
                
                # Starts a timer for the piece to lock in place (piece lock) on its own.
                else:
                    if not self.lock_delay:
                        self.lock_delay = True
                        self.active_piece.move_reset_counter = 0
                        pygame.time.set_timer(PIECE_LOCK, 500)
            
            # Deactivates the piece lock timer if the piece moves down successfully before the player maxes out their move reset.
            elif self.active_piece.move_reset_counter < 15:
                pygame.time.set_timer(PIECE_LOCK, 0)
                self.lock_delay = False
                    
    def hard_drop(self):
        '''Drops active piece down as far as it can go.'''
        
        if debug:
                print("Tetris.hard_drop() called")
                
        self.hard_dropping = True
        self.soft_dropping = False
        
        while self.hard_dropping:
            self.move_piece_down()
            
    def intersects(self, x_difference = 0, y_difference = 0, rotation_difference = 0):
        '''Checks if a piece is outside of the matrix and returns the result. Allows for checks using altered coordinates and rotations.'''
                
        self.intersection_scan_dimension = self.get_scan_dimension()
        
        intersection = False      
        for i in range(self.intersection_scan_dimension):
            for j in range(self.intersection_scan_dimension):
                if i * self.intersection_scan_dimension + j in self.active_piece.image(rotation_difference):
                    if i + self.active_piece.y - y_difference > Tetris.MATRIX_HEIGHT - 1 or \
                                 i + self.active_piece.y - y_difference < 0 or \
                                 j + self.active_piece.x + x_difference < 0 or \
                                 j + self.active_piece.x + x_difference > Tetris.MATRIX_WIDTH - 1 or \
                                 self.field[i + self.active_piece.y - y_difference][j + self.active_piece.x + x_difference] != 0:
                        intersection = True
                    
        return(intersection)
    
# Initialize game engine
pygame.init()

# Create fonts for in-game text    
VARIABLE_DISPLAY_FONT = pygame.font.SysFont("verdana", 12)
GAME_OVER_FONT = pygame.font.SysFont("consolas", 24)

# Create window
SCREEN_SIZE = (20 * Tetris.GAME_ZOOM, 25 * Tetris.GAME_ZOOM)
screen = pygame.display.set_mode(SCREEN_SIZE)
pygame.display.set_caption("Tetris but Awesome")

# Initialize game
clock = pygame.time.Clock()
FPS = 60
current_frame = 0
game = Tetris()
running = True
debug = False

while running:
    # Stores the current frame and level.
    current_frame = (current_frame + 1) % FPS
    game.level = 1 + game.total_lines_cleared // 10
    
    if game.active_piece == None:
        game.active_piece = Tetromino("Queue")
    
    try:
        if current_frame % Tetris.GRAVITIES[game.level - 1][0] == 0:
            for i in range(Tetris.GRAVITIES[game.level][1]):
                game.move_piece_down()
                
    except IndexError:
        if current_frame % Tetris.GRAVITIES[13][0] == 0:
            for i in range(Tetris.GRAVITIES[13][1]):
                game.move_piece_down()
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            pygame.quit()
        
        # Checks for key inputs that only matter when the game of Tetris hasn't been lost yet
        if event.type == pygame.KEYDOWN and game.game_active == True:
            if event.key == pygame.K_LSHIFT:
                game.soft_dropping = True
            
            # Left and right movement
            if event.key == pygame.K_a:
                game.move_piece_h(-1)
                pygame.time.set_timer(DAS_LEFT, 133)
                game.do_das_right = False
            if event.key == pygame.K_d:
                game.move_piece_h(1)
                pygame.time.set_timer(DAS_RIGHT, 133)
                game.do_das_left = False
                
            # Inputs for piece rotation
            if event.key == pygame.K_j:
                game.call_rotation(-1)
            if event.key == pygame.K_k:
                game.call_rotation(2)
            if event.key == pygame.K_l:
                game.call_rotation(1)
            
            if event.key == pygame.K_SLASH:
                game.hold_piece()
            if event.key == pygame.K_s:
                game.hard_drop()
            
            if event.key == pygame.K_F1:
                debug = not debug
        
        # Checks for key inputs that matter regardless of game state. Currently, this is only the reset key.
        if event.type == pygame.KEYDOWN:
                
            if event.key == pygame.K_c:
                game = Tetris()
        
        # Checks for a key non-input so the game knows when to stop soft-dropping / DASing.
        if event.type == pygame.KEYUP:
                if event.key == pygame.K_LSHIFT:
                    game.soft_dropping = False
                    
                if event.key == pygame.K_a:
                    pygame.time.set_timer(DAS_LEFT, 0)
                    game.do_das_left = False
                if event.key == pygame.K_d:
                    pygame.time.set_timer(DAS_RIGHT, 0)
                    game.do_das_right = False
        
        # Places a piece if the Piece Lock timer runs out.
        if event.type == PIECE_LOCK and game.game_active:
            if debug:
                print("PIECE_LOCK pushed")
                
            game.place_piece()
        
        # If left or right movement keys have been held without interruption for long enough, enable repeated left/right movement
        if event.type == DAS_LEFT:
            game.do_das_left = True
            pygame.time.set_timer(DAS_RIGHT, 0)
            
        if event.type == DAS_RIGHT:
            game.do_das_right = True
            pygame.time.set_timer(DAS_LEFT, 0)
            
    if game.soft_dropping == True:
        game.move_piece_down()
        
    if game.do_das_right and current_frame % 2 == 0:
        game.move_piece_h(1)
    
    if game.do_das_left and current_frame % 2 == 0:
        game.move_piece_h(-1)
    
    # Checks for intersection after everything else. Attempts to rotate as a failsave, then 
    if game.intersects():
        if debug:
            print("game over")
        game.game_active = False
    
    screen.fill(BLACK)
    
    if game.game_active:
        square_colors = TETROMINO_COLORS
        
    else:
        square_colors = [DEAD_SQUARE_GREY for i in range(len(TETROMINO_COLORS))]

    # For each square in the matrix,
    for i in range(Tetris.MATRIX_HEIGHT):
        for j in range(Tetris.MATRIX_WIDTH):
            
            # If square in matrix is empty...
            if game.field[i][j] == 0:
                
                # ...Draw the grid for the matrix.
                pygame.draw.rect(screen, GRID_GREY, [Tetris.GAME_ZOOM * (Tetris.MATRIX_X_OFFSET + j), Tetris.GAME_ZOOM * (Tetris.MATRIX_Y_OFFSET + i), Tetris.GAME_ZOOM, Tetris.GAME_ZOOM], 1)
            
            # If the game is active, draw all placed Tetrominoes in color.
            elif game.game_active:
                pygame.draw.rect(screen, square_colors[game.field[i][j] - 1], [Tetris.GAME_ZOOM * (Tetris.MATRIX_X_OFFSET + j), Tetris.GAME_ZOOM * (Tetris.MATRIX_Y_OFFSET + i), Tetris.GAME_ZOOM - 0, Tetris.GAME_ZOOM - 0])
            
            # Otherwise, grey them out.
            else:
                pygame.draw.rect(screen, DEAD_SQUARE_GREY, [Tetris.GAME_ZOOM * (Tetris.MATRIX_X_OFFSET + j), Tetris.GAME_ZOOM * (Tetris.MATRIX_Y_OFFSET + i), Tetris.GAME_ZOOM - 0, Tetris.GAME_ZOOM - 0])
    
    # Find the position of the ghost piece
    for i in range(Tetris.MATRIX_HEIGHT):
        if game.intersects(0, -i, 0):
            ghost_piece_y_difference = i - 1
            break
    
    # Draw the ghost piece
    rendering_scan_dimension = game.get_scan_dimension()
    for i in range(rendering_scan_dimension):
        for j in range(rendering_scan_dimension):
            if i * rendering_scan_dimension + j in game.active_piece.image():
                pygame.draw.rect(screen, DEAD_SQUARE_GREY,
                                 [
                                     Tetris.GAME_ZOOM * (Tetris.MATRIX_X_OFFSET + game.active_piece.x + j),
                                     Tetris.GAME_ZOOM * (Tetris.MATRIX_Y_OFFSET + game.active_piece.y + i + ghost_piece_y_difference),
                                     Tetris.GAME_ZOOM,
                                     Tetris.GAME_ZOOM
                                     ]
                                 )
    # Draw the active piece
    rendering_scan_dimension = game.get_scan_dimension()
    for i in range(rendering_scan_dimension):
        for j in range(rendering_scan_dimension):
            if i * rendering_scan_dimension + j in game.active_piece.image():
                pygame.draw.rect(screen, square_colors[game.active_piece.type],
                                 [
                                     Tetris.GAME_ZOOM * (Tetris.MATRIX_X_OFFSET + game.active_piece.x + j),
                                     Tetris.GAME_ZOOM * (Tetris.MATRIX_Y_OFFSET + game.active_piece.y + i),
                                     Tetris.GAME_ZOOM,
                                     Tetris.GAME_ZOOM
                                     ]
                                 )
                
    # Draw the earliest 5 items in the queue.            
    for i in range(5):
        try:
            queue_rendering_scan_dimension = game.get_scan_dimension("Queue", game.queue[i])
            
        except IndexError:
            break
        
        for i1 in range(queue_rendering_scan_dimension):
            for j in range(queue_rendering_scan_dimension):
                if i1 * queue_rendering_scan_dimension + j in Tetromino.FIGURES[game.queue[i]][0]:
                    if game.queue[i] == 0:
                        figure_render_offset_x = -1
                        figure_render_offset_y = -2
                    
                    else:
                        figure_render_offset_x = 0
                        figure_render_offset_y = 0
                        
                    pygame.draw.rect(screen, TETROMINO_COLORS[game.queue[i]],
                                [
                                    Tetris.GAME_ZOOM * (Tetris.MATRIX_X_OFFSET + Tetris.MATRIX_WIDTH + 0.5 + j + figure_render_offset_x),
                                    Tetris.GAME_ZOOM * (Tetris.MATRIX_Y_OFFSET + 1 + i1 + figure_render_offset_y + i * 3),
                                    Tetris.GAME_ZOOM,
                                    Tetris.GAME_ZOOM
                                    ]
                                )
                    
    # Draw the held piece, if there is one.                
    if game.piece_held != None:
        
        hold_rendering_scan_dimension = game.get_scan_dimension("Hold", game.piece_held)
        for i in range(hold_rendering_scan_dimension):
            for j in range(hold_rendering_scan_dimension):
                if i * hold_rendering_scan_dimension + j in Tetromino.FIGURES[game.piece_held][0]:
                    if game.piece_held == 0:
                        figure_render_offset_x = -1
                        figure_render_offset_y = -2
                    
                    else:
                        figure_render_offset_x = 0
                        figure_render_offset_y = 0
                        
                    pygame.draw.rect(screen, TETROMINO_COLORS[game.piece_held],
                                [
                                    Tetris.GAME_ZOOM * (Tetris.MATRIX_X_OFFSET - 4.5 + j + figure_render_offset_x),
                                    Tetris.GAME_ZOOM * (Tetris.MATRIX_Y_OFFSET + 1 + i + figure_render_offset_y),
                                    Tetris.GAME_ZOOM,
                                    Tetris.GAME_ZOOM
                                    ]
                                )
    
    # Create game info display text
    score_display_text = VARIABLE_DISPLAY_FONT.render(f"Score: {game.score}", True, WHITE)
    level_display_text = VARIABLE_DISPLAY_FONT.render(f"Level: {game.level}", True, WHITE)
    lines_display_text = VARIABLE_DISPLAY_FONT.render(f"Lines: {game.total_lines_cleared}", True, WHITE)
    
    # Create game over text
    game_over_text_1 = GAME_OVER_FONT.render("Game Over!", True, BLACK)
    game_over_text_2 = GAME_OVER_FONT.render("Press C.", True, BLACK)
    
    # Blit display text to screen
    display_text_x = 15
    display_text_y = 100
    for i in [score_display_text, level_display_text, lines_display_text]:
        screen.blit(i, [display_text_x, display_text_y])
        display_text_y += 30

    # Blits game over text to screen if game has been lost.
    if game.game_active == False:
        pygame.draw.rect(screen, YELLOW, [Tetris.GAME_ZOOM * Tetris.MATRIX_X_OFFSET, Tetris.GAME_ZOOM * 7 + Tetris.GAME_ZOOM * Tetris.MATRIX_Y_OFFSET, Tetris.GAME_ZOOM * Tetris.MATRIX_WIDTH, Tetris.GAME_ZOOM * 3])
        screen.blit(game_over_text_1, (Tetris.GAME_ZOOM * (Tetris.MATRIX_X_OFFSET + Tetris.MATRIX_WIDTH) // 2, Tetris.GAME_ZOOM * 7.5 + Tetris.GAME_ZOOM * Tetris.MATRIX_Y_OFFSET))
        screen.blit(game_over_text_2, (Tetris.GAME_ZOOM * (Tetris.MATRIX_X_OFFSET + Tetris.MATRIX_WIDTH) // 2, Tetris.GAME_ZOOM * 8.5 + Tetris.GAME_ZOOM * Tetris.MATRIX_Y_OFFSET))
        
    pygame.display.flip()
    clock.tick(FPS)
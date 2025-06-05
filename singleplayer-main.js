// Tetris In Javascript
// Luke Pawle-Fahy
// 5/7/2025
//
// Extra for Experts:
// Heavy use of Classes, JSON,
// various operators and methods [examples include shift(), spread and rest operators, call()]

const MATRIX_WIDTH = 10;
const MATRIX_HEIGHT = 20;
const QUEUE_LENGTH = 5;
const VANISH_ZONE_HEIGHT = 20;

let autoStartDelay = 10;
let autoRepeatRate = 3; // All of these are frames-per-delay/repetition, higher is slower
let softDropSpeed = 3;

let temporaryTetrominoColors;

let tetrominoFigures;
let tetrominoOffsetData;
let levelGravities;
let controls;

let keyHeldTimes;

let tasks = [];
let theGame;

let sprites = [];
let skin = 0;

class Tetromino {
  // a singular Tetris piece.
  constructor(type = 0) {
    this.type = type,
    this.rotation = 0;

    // Applies offset to I tetromino's spawning coordinates, aligning its position with the other 6 tetrominoes.
    if (this.type !== 0) {
      this.x = 3,
      this.y = 1;
    }
    else {
      this.x = 2,
      this.y = 0;
    }

  }

  // Returns the Tetromino's figure as found in tetromino-figures.json
  image(rotation = this.rotation, type = this.type) {
    try {
      return tetrominoFigures[type][rotation];
    }
    catch(TypeError) {
      return ["wallace"];
    }
  }

}

class Tetris {
  // A game of Tetris.

  // Setup
  constructor(displayX, displayY, displayW, displayH) {

    // Display
    this.display = new GameDisplay(displayX, displayY, displayW, displayH, this); //values for testing
    this.ghostPieceY = undefined;

    // Asynchronous Stuff
    this.tasks = [];

    // Stats
    this.score = 0,
    this.level = 0,
    this.linesCleared = 0,

    // Tetromino Placement
    this.activePiece = null,
    this.heldPieceType = null,
    this.queue = [],
    this.matrix = Tetris.createNewMatrix(),
    
    // Movement
    this.holdUsed = false,
    this.droppingHard = false,
    this.droppingSoft = false,
    this.delayedAutoStart = null,
    this.autoRepeat = true,
    
    // Lock Delay & Move Reset
    this.lockDelay = false,
    this.moveResetCounter = 0,

    // Initialization
    this.refillNextQueue();
    this.advanceNextQueue();
    this.findGhostPieceY();

    // Game State
    this.active = true;
    this.exists = true;
  }

  static createNewMatrix() {
    // Creates a 2D array of specified proportions in which every value is null.

    let newMatrix = [];
    for (let i = 0; i < MATRIX_HEIGHT; i++) {
      newMatrix.push([]);
      for (let j = 0; j < MATRIX_WIDTH; j++) {
        newMatrix[i].push(null);
      }
    }
    return newMatrix;
  }

  // Active Piece / Matrix Methods
  rotateTetromino(rotationDistance = 0) {
    // Rotate the active Tetromino.

    if (this.activePiece !== null) {
      let newRotation = this.activePiece.rotation + rotationDistance;
      while (newRotation < 0) {
        newRotation += 4;
      }
      newRotation %= 4;
      switch (this.activePiece.type) {

      // If active piece is an 'I' Tetromino, apply respective offset data.
      case 0:

        // For each column of the Offset Data table,
        for (let i = 0; i < tetrominoOffsetData[1].table[0].length; i++) {

          // Given a column, subtract the X, Y values found in the New Rotation's row from the X, Y values found in the current rotation's row.
          let offsetX = tetrominoOffsetData[1].table[this.activePiece.rotation][i][0] - tetrominoOffsetData[1].table[newRotation][i][0];
          let offsetY = tetrominoOffsetData[1].table[this.activePiece.rotation][i][1] - tetrominoOffsetData[1].table[newRotation][i][1];

          // If there's no intersection at (the active piece's current coordinates plus the offsets), apply the offsets, rotate the piece, and exit the loop.
          if (!this.intersects(this.activePiece.x + offsetX, this.activePiece.y - offsetY, newRotation, undefined)) {
            this.activePiece.x += offsetX;
            this.activePiece.y -= offsetY;
            this.activePiece.rotation = newRotation;
            this.ghostPieceY = this.findGhostPieceY();
            break;
          }
        }

        break;


      // If active piece is an 'O' Tetromino, apply respecitve offset data.
      case 3:
        
        // For each column of the Offset Data table,
        for (let i = 0; i < tetrominoOffsetData[2].table[0].length; i++) {
          
          // Given a column, subtract the X, Y values found in the New Rotation's row from the X, Y values found in the current rotation's row.
          let offsetX = tetrominoOffsetData[2].table[this.activePiece.rotation][i][0] - tetrominoOffsetData[2].table[newRotation][i][0];
          let offsetY = tetrominoOffsetData[2].table[this.activePiece.rotation][i][1] - tetrominoOffsetData[2].table[newRotation][i][1];

          // If there's no intersection at (the active piece's current coordinates plus the offsets), apply the offsets, rotate the piece, and exit the loop.
          if (!this.intersects(this.activePiece.x + offsetX, this.activePiece.y - offsetY, newRotation, undefined)) {
            this.activePiece.x += offsetX;
            this.activePiece.y -= offsetY;
            this.activePiece.rotation = newRotation;
            this.ghostPieceY = this.findGhostPieceY();
            break;
          }
        }
        break;

      // If active piece is a J, L, S, T, or Z tetromino, apply respective offset data.
      default:

        // For each column of the Offset Data table,
        for (let i = 0; i < tetrominoOffsetData[0].table[0].length; i++) {

          // Given a column, subtract the X, Y values found in the New Rotation's row from the X, Y values found in the current rotation's row.
          let offsetX = tetrominoOffsetData[0].table[this.activePiece.rotation][i][0] - tetrominoOffsetData[0].table[newRotation][i][0];
          let offsetY = tetrominoOffsetData[0].table[this.activePiece.rotation][i][1] - tetrominoOffsetData[0].table[newRotation][i][1];

          // If there's no intersection at (the active piece's current coordinates plus the offsets), apply the offsets, rotate the piece, and exit the loop.
          if (!this.intersects(this.activePiece.x + offsetX, this.activePiece.y - offsetY, newRotation, undefined)) {
            this.activePiece.x += offsetX;
            this.activePiece.y -= offsetY;
            this.activePiece.rotation = newRotation;
            this.ghostPieceY = this.findGhostPieceY();
            break;
          }
        }
        break;
      }
    }
    else {
      throw new Error("Active Piece does not exist.");
    }
  }

  moveTetrominoX(dx = 0) {
    // Moves the active piece to the left or to the right.
    if (this.activePiece !== null && !this.intersects(this.activePiece.x + dx, undefined)) {
      this.activePiece.x += dx;
      this.ghostPieceY = this.findGhostPieceY();
    }
  }

  moveTetrominoY(dy = 1) {
    // Moves the active piece either up (which can currently never happen) or down.

    // If this.activePiece exists,
    if (this.activePiece !== null) {

      // Check if the destination intersects with anything.
      if (this.intersects(undefined, this.activePiece.y + dy)) {

        // Shift Destination back out until it no longer intersects.
        while (this.intersects(undefined, this.activePiece.y + dy)) {
          if (dy > 0) {
            dy -= 1;
          }

          else if (dy < 0) {
            dy += 1;
          }

          else if (dy === 0) {
            break;
          }

          else {
            return -1;
          }
        }

        // Move the Active Piece to the Destination
        this.activePiece.y += dy;
        this.ghostPieceY = this.findGhostPieceY();

        if (this.shouldPlaceTetromino()) {
          this.placeTetromino();
          this.droppingHard = false;
        }

        // Start the 0.5 second Lock Delay timer if it isn't currently happening.
        else if (!this.lockDelay) {
          this.lockDelay = true;
          this.moveResetCounter = 0;
        }
      }
      else {
        // Move the Active Piece to the Destination
        this.activePiece.y += dy;
        this.ghostPieceY = this.findGhostPieceY();
      }
    }
  }

  placeTetromino(x = this.activePiece.x, y = this.activePiece.y, rotation = this.activePiece.rotation, type = this.activePiece.type) {
    // If the Tetromino is placable,
    if (this.canPlaceTetromino(x, y, rotation, type)) {

      // Iterate through a virtual 5x5 Array
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {

          // If the active piece's image includes the current space in the virtual array,
          if (this.activePiece.image(rotation, type).includes(i * 5 + j)) {

            // That space in the matrix is set to the active piece's type.
            this.matrix[y + i][x + j] = this.activePiece.type;
          }
        }
      }

      this.droppingHard = false;
      this.activePiece = null;

      // Clear lines and advance the queue.
      this.clearLines();
      this.advanceNextQueue();
      this.holdUsed = false;
    }
  }

  holdTetromino() {
    // Swaps the active Tetromino with the one stored in the "hold" space.

    if (this.activePiece !== null && !this.holdUsed) {
      this.holdUsed = true;
      if (this.heldPieceType === null) {
        this.heldPieceType = this.activePiece.type;
        this.activePiece = null;
        this.advanceNextQueue();
        this.ghostPieceY = this.findGhostPieceY();
      }
      else {
        [this.activePiece, this.heldPieceType] = [new Tetromino(this.heldPieceType), this.activePiece.type];
        this.ghostPieceY = this.findGhostPieceY();
      } 
    }
  }

  hardDrop() {
    this.droppingHard = true;
    this.droppingSoft = false;

    while (this.droppingHard) {
      this.moveTetrominoY(1);
    }
  }

  clearLines() {
    // Clear rows in the matrix that are entirely full.

    let lines = 0;

    // Iterate through each row, starting at the top
    for (let i = 0; i < this.matrix.length; i++) {

      // If the row is full,
      if (this.matrix[i].indexOf(null) === -1) {
        lines += 1;

        // Iterate through rows, starting at the current row and ending one row below the top.
        for (let i1 = i; i1 > 0; i1--) {
          for (let j = 0; j < this.matrix[i1].length; j++) {
            this.matrix[i1][j] = this.matrix[i1 - 1][j];
          }
        }

        // Top row = Array of length (length of top row) filled with null.
        this.matrix[0] = Array(this.matrix[0].length).fill(null);
      }
    }

    // Basic Per-Line Scoring
    switch (lines) {
    case 1:
      this.score += 100 * this.level;
      break;
    case 2:
      this.score += 300 * this.level;
      break;
    case 3:
      this.score += 500 * this.level;
      break;
    case 4:
      this.score += 800 * this.level;
      break;
    default:
      // Nothing
      break;
    }

    // Adding to linesCleared and increasing level (if statement so you can cheat your level upwards without it resetting every time a piece is placed)
    this.linesCleared += lines;
    if (Math.floor(this.linesCleared / 10) > this.level) {
      this.level = Math.floor(this.linesCleared / 10);
    }
  }

  // Queue Methods
  advanceNextQueue() {
    // Advances the queue of upcoming Tetrominoes.

    if (this.activePiece === null) {
      this.activePiece = new Tetromino(this.queue.shift());
      this.refillNextQueue();
      this.ghostPieceY = this.findGhostPieceY();
    }
    else {
      throw new Error("Active Piece already exists.");
    }
  }

  refillNextQueue() {
    // Refills the queue of upcoming Tetrominoes when depleted.

    // If the queue is shorter than the displayed queue length, refill it with shuffled values 0-6.
    if (this.queue.length < QUEUE_LENGTH) {
      this.queue.push(...shuffle([0, 1, 2, 3, 4, 5, 6]));
    }
  }

  // Conditionals
  shouldPlaceTetromino() {
    // Returns true if, when a piece is moved down, it should be placed automatically. Returns false otherwise.
    // This does not account for the regular, milliseconds based Piece Lock.
    return this.droppingHard || this.moveResetCounter >= 15;
  }

  canPlaceTetromino(x = this.activePiece.x, y = this.activePiece.y, rotation = this.activePiece.rotation, type = this.activePiece.type) {
    return !this.intersects(x, y, rotation, type) && this.intersects(x, y + 1, rotation, type);
  }

  intersects(x = this.activePiece.x, y = this.activePiece.y, rotation = this.activePiece.rotation, type = this.activePiece.type) {
    // Returns true if the piece passed through the parameters intersects with the outer bounds of the matrix or a placed tetromino.
    let intersection = false;
    let temp = this.activePiece.image(rotation, type);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (temp.includes(i * 5 + j)) {
          if (
            y + i < 0 ||
            y + i > this.matrix.length - 1 ||
            x + j < 0 ||
            x + j > this.matrix[y + i].length - 1 ||
            this.matrix[y + i][x + j] !== null
          ) {
            intersection = true;
          }
        }
      }
    }
    return intersection;
  }

  // Game Loop Stuff ????? Needs to be reorganized at some point
  handleGravity() {
    try {
      if (frameCount % levelGravities[this.level][0] === 0) {
        this.moveTetrominoY(levelGravities[this.level][1]);
      }
    }
    catch(rangeError) {
      if (frameCount % levelGravities[levelGravities.length - 1][0] === 0) {
        this.moveTetrominoY(levelGravities[levelGravities.length - 1][1]);
      }
    }
  }

  handleDAS() {
    let rightTime = keyHeldTimes.get(str(controls.moveRight));
    let leftTime = keyHeldTimes.get(str(controls.moveLeft));

    // The delay before auto-repetition can start, currently a constant and magic 10 frames
    let leftPassedDelay = leftTime > autoStartDelay;
    let rightPassedDelay = rightTime > autoStartDelay;

    // Checks for if leftTime and rightTime align with the auto-repeat rate, currently a constant and magic 10 frames.
    let leftMatchesAutoRepeatRate = leftTime % autoRepeatRate === 0;
    let rightMatchesAutoRepeatRate = rightTime % autoRepeatRate === 0;

    // If neither key matches the ARR, exit the function.
    if (!(leftMatchesAutoRepeatRate || rightMatchesAutoRepeatRate)) {
      return -1;
    }

    if (leftPassedDelay && !rightPassedDelay && leftMatchesAutoRepeatRate) {
      this.moveTetrominoX(-1);
    }
    else if (!leftPassedDelay && rightPassedDelay && rightMatchesAutoRepeatRate) {
      this.moveTetrominoX(1);
    }
    else if (leftPassedDelay && rightPassedDelay) {
    
      // Moves based on the more recent of the two inputs, with a frame-perfect tie biasing to the right.
      if (rightTime < leftTime) {
        if (rightMatchesAutoRepeatRate) {
          this.moveTetrominoX(1);
        }
      }
      else {
        if (leftMatchesAutoRepeatRate) {
          this.moveTetrominoX(-1);
        }
      }
    }
    else {
      // No DAS movement occurs
      return -1;
    }
  }

  handleSoftDrop() {
    let softTime = keyHeldTimes.get(str(controls.softDrop));
    let softMatchesDropSpeed = softTime % softDropSpeed === 0;

    if (softMatchesDropSpeed && softTime > 0) {
      this.moveTetrominoY(1);
    }
  }

  // Game-end stuff for displays
  findGhostPieceY() {
    if (this.activePiece !== null) {
      let ghostPieceY = this.activePiece.y;
      let dropAllowed = true;

      // While the ghost piece can move down, attempt to move it down one row.
      while (dropAllowed) {
        if (!this.intersects(undefined, ghostPieceY + 1, undefined, undefined)) {
          ghostPieceY += 1;
        }
        else {
          dropAllowed = false;
        }
      }

      return ghostPieceY;
    }
    else {
      throw new Error("Active piece does not exist.");
    }
  }
}

class GameDisplay {
  /* The GameDisplay Class describes a rectangular surface in which an instance of Tetris is displayed,
  With one of these being created for each player in multiplayer.
  
  The purpose of this class is to make scaling, moving, and otherwise altering the way an instance is displayed easier.
  The purpose of the sub-displays (see the constructor function) are to make the same alterations towards individual elements of the display (IE the Next Queue) easier.
  
  For example, moving an instance's display ten pixels to the right can be done by adding 10 to the GameDisplay's 'x' value.
  Similarly, moving the matrix's display within an instance down by 1/10 of the screen can be done by adding (1/10 * GameDisplay.baseHeight) to the matrixDisplay's 'y' value.
  */

  constructor(x, y, w, h, game) {
    // Relative to window
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.game = game;

    // Base dimensions and zoom
    this.baseWidth = 100;
    this.baseHeight = 100;
    this.zoom = findZoom(this.baseWidth, this.baseHeight, w, h);

    // Sub-displays for matrix, hold, and queue that are scaled to the root display's dimensions in their draw functions

    this.matrixDisplay = {
      relativeX: this.baseWidth / 10,
      relativeY: this.baseHeight / 10,
      relativeWidth: this.baseWidth - this.baseWidth / 5,
      relativeHeight: this.baseHeight / 1.5,
      relativeCellSize: undefined
    };

    this.matrixDisplay.relativeCellSize = this.matrixDisplay.relativeWidth / MATRIX_WIDTH;

    this.holdDisplay = {
      relativeWidth: this.baseWidth / 6,
      relativeHeight: this.baseHeight / 12,
      relativeX: undefined,
      relativeY: undefined,
      relativeCellSize: undefined
    };

    this.holdDisplay.relativeCellSize = this.holdDisplay.relativeWidth / 4;

    this.holdDisplay.relativeX = this.matrixDisplay.relativeX - this.holdDisplay.relativeWidth /* subtract margin*/;
    this.holdDisplay.relativeY = this.matrixDisplay.relativeY /* + an offset */;

    this.queueDisplay = {
      relativeWidth: this.baseWidth / 6,
      relativeHeight: this.baseHeight / 3,
      relativeX: undefined,
      relativeY: undefined,
      relativeCellSize: undefined,
    };

    this.queueDisplay.relativeX = this.matrixDisplay.relativeX + this.matrixDisplay.relativeWidth /* + margin */;
    this.queueDisplay.relativeY = this.matrixDisplay.relativeY /* + an offset */;
    this.queueDisplay.relativeCellSize = 1 * findZoom(4, 3 * QUEUE_LENGTH, this.queueDisplay.relativeWidth, this.queueDisplay.relativeHeight);

  }

  displayMatrix() {
    // Temporary variable for the absolute size of a cell in the matrix
    let cellAbsoluteSize = this.zoom * this.matrixDisplay.relativeCellSize;

    // Draw Placed Pieces in the matrix
    for (let i = 0; i < MATRIX_HEIGHT; i++) {
      for (let j = 0; j < MATRIX_WIDTH; j++) {

        // (i + VANISH_ZONE_HEIGHT if vanish zone is implemented)
        let cellType = this.game.matrix[i][j];

        // Temporary variables for the cell's absolute position
        // Will need reworking for vanihsh zone
        let cellAbsoluteX = this.x + this.zoom * (this.matrixDisplay.relativeX + j * this.matrixDisplay.relativeCellSize);
        let cellAbsoluteY = this.y + this.zoom * (this.matrixDisplay.relativeY + i * this.matrixDisplay.relativeCellSize);

        // image(sprites[skin][cellType], cellAbsoluteX, cellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
        if (cellType === null) {
          fill(temporaryTetrominoColors[9]);
        }
        else {
          fill(temporaryTetrominoColors[cellType]);
        }
        rect(cellAbsoluteX, cellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
      }
    }

    // Find the Y Position of the ghost piece
    let displayGhostPieceY = this.game.ghostPieceY;

    // Draw the ghost piece in the matrix (The active piece's position if it were to be hard-dropped)
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (this.game.activePiece.image().includes(i * 5 + j)) {
          let ghostCellAbsoluteX = this.x + this.zoom * (this.matrixDisplay.relativeX + (this.game.activePiece.x + j) * this.matrixDisplay.relativeCellSize);
          let ghostCellAbsoluteY = this.y + this.zoom * (this.matrixDisplay.relativeY + (displayGhostPieceY + i) * this.matrixDisplay.relativeCellSize);

          // image(sprites[skin][2048 /* Ghost piece type needs to go here */], ghostCellAbsoluteX, ghostCellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
          fill(temporaryTetrominoColors[8]);
          rect(ghostCellAbsoluteX, ghostCellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
        }
      }
    }

    // Draw the active piece in the matrix
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (this.game.activePiece.image().includes(i * 5 + j)) {
          let activeCellAbsoluteX = this.x + this.zoom * (this.matrixDisplay.relativeX + (this.game.activePiece.x + j) * this.matrixDisplay.relativeCellSize);
          let activeCellAbsoluteY = this.y + this.zoom * (this.matrixDisplay.relativeY + (this.game.activePiece.y + i) * this.matrixDisplay.relativeCellSize);

          // image(sprites[skin][this.game.activePiece.type], activeCellAbsoluteX, activeCellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
          fill(temporaryTetrominoColors[this.game.activePiece.type]);
          rect(activeCellAbsoluteX, activeCellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
        }
      }
    }
  }

  displayQueue() {
    // Equivalent to the drawing of the queue in tetris.py's while running loop.

    let cellAbsoluteSize = this.zoom * this.queueDisplay.relativeCellSize;

    // Background
    fill(temporaryTetrominoColors[9]);
    let backgroundAbsoluteX = this.x + this.zoom * this.queueDisplay.relativeX;
    let backgroundAbsoluteY = this.y + this.zoom * this.queueDisplay.relativeY;
    rect(backgroundAbsoluteX, backgroundAbsoluteY, this.zoom * this.queueDisplay.relativeWidth, this.zoom * this.queueDisplay.relativeHeight);

    // Main
    for (let queueIndex = 0; queueIndex < QUEUE_LENGTH; queueIndex++) {
      let currentTetrominoType = this.game.queue[queueIndex];
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (this.game.activePiece.image(0, currentTetrominoType).includes(i * 5 + j)) {
            fill(temporaryTetrominoColors[currentTetrominoType]);
            if (currentTetrominoType === 0) {
              let queueCellAbsoluteX = this.x + this.zoom * (this.queueDisplay.relativeX + (j - 1) * this.queueDisplay.relativeCellSize);
              let queueCellAbsoluteY = this.y + this.zoom * (this.queueDisplay.relativeY + (i + 4 * queueIndex - 1) * this.queueDisplay.relativeCellSize);

              rect(queueCellAbsoluteX, queueCellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
            }
            else {
              let queueCellAbsoluteX = this.x + this.zoom * (this.queueDisplay.relativeX + j * this.queueDisplay.relativeCellSize);
              let queueCellAbsoluteY = this.y + this.zoom * (this.queueDisplay.relativeY + (i + 4 * queueIndex) * this.queueDisplay.relativeCellSize);

              rect(queueCellAbsoluteX, queueCellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
            }
            
            // image(sprites[skin][currentTetrominoType], queueCellAbsoluteX, queueCellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
            
          }
        }
      }
    }
  }

  displayHold() {
    // Equivalent to the drawing of the hold space in tetris.py's while running loop.

    let cellAbsoluteSize = this.zoom * this.holdDisplay.relativeCellSize;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (this.game.heldPieceType !== null && this.game.activePiece.image(0, this.game.heldPieceType).includes(i * 5 + j)) {
          let heldCellAbsoluteX = this.x + this.zoom * (this.holdDisplay.relativeX + j * this.holdDisplay.relativeCellSize);
          let heldCellAbsoluteY = this.y + this.zoom * (this.holdDisplay.relativeY + i * this.holdDisplay.relativeCellSize);
          // image(sprites[skin][this.game.heldPieceType], heldCellAbsoluteX, heldCellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
          fill(temporaryTetrominoColors[this.game.heldPieceType]);
          rect(heldCellAbsoluteX, heldCellAbsoluteY, cellAbsoluteSize, cellAbsoluteSize);
        }
      }
    }
  }

  displayAll() {
    // Runs all other display functions.
    this.displayMatrix();
    this.displayHold();
    this.displayQueue();
  }
}

function preload() {
  tetrominoFigures = loadJSON('/data-tables/tetromino-figures.json');
  tetrominoOffsetData = loadJSON('/data-tables/offset-data.json');
  levelGravities = loadJSON('/data-tables/level-gravities.json');
  controls = loadJSON('/user-settings/controls.json');

  dasRates = loadJSON('/user-settings/das-arr-rates.json'); // fix this

  // Loading sprites
  // let skinZero = [];

  // let skinZeroI = loadImage('/sprites/skin0/i-mino.png');
  // skinZero.push(skinZeroI);
  /* and so on... */

  // sprites.push([skinZero]);
}

function setup() {
  levelGravities = Object.values(levelGravities);

  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  noStroke();

  keyHeldTimes = new Map();
  keyHeldTimes.set(str(controls.moveLeft), 0);
  keyHeldTimes.set(str(controls.moveRight), 0);
  keyHeldTimes.set(str(controls.softDrop), 0);

  temporaryTetrominoColors = [
    color(0, 255, 255), // 0: I
    color(0, 0, 255), // 1: J
    color(255, 127, 0), // 2: L
    color(255, 255, 0), // 3: O
    color(0, 255, 0), // 4: S
    color(128, 0, 128), // 5: T
    color(255, 0, 0), // 6: Z
    color(150, 150, 150), // 7: Dead Square Grey
    color(90, 90, 90), // 8: Ghost Piece Grey
    color(0, 0, 0) // 9: Black
  ];

  theGame = new Tetris(100, 100, 300, 300);
}

function findZoom(targetW, targetH, destinationW, destinationH) {
  // Return the highest factor by which the size of the target rectangle can be scaled such that it can still fit within the destination rectangle.
  let zoom;
  if (destinationW < destinationH) {
    zoom = destinationW / targetW;
  }
  else {
    zoom = destinationH / targetH;
  }
  return zoom;
} 

function keyPressed(event) {
  if (event.code === controls.reset) {

  }
  if (event.code === controls.rotateRight) {
    theGame.rotateTetromino(1);
  }
  else if (event.code === controls.rotateLeft) {
    theGame.rotateTetromino(-1);
  }
  else if (event.code === controls.rotate180) {
    theGame.rotateTetromino(2);
  }

  if (event.code === controls.moveRight) {
    //
    theGame.moveTetrominoX(1);
    keyHeldTimes.set(str(controls.moveRight), 1);
  }
  if (event.code === controls.moveLeft) {
    theGame.moveTetrominoX(-1);
    keyHeldTimes.set(str(controls.moveLeft), 1);
  }

  if (event.code === controls.hold) {
    theGame.holdTetromino();
  }

  if (event.code === controls.hardDrop) {
    theGame.hardDrop();
  }

  if (event.code === controls.softDrop) {
    keyHeldTimes.set(str(controls.softDrop), 1);
    return false;
  }

  if (event.code === controls.pause) {

  }
}

function keyReleased(event) {
  if (event.code === controls.moveLeft) {
    keyHeldTimes.set(str(controls.moveLeft), 0);
  }
  if (event.code === controls.moveRight) {
    keyHeldTimes.set(str(controls.moveRight), 0);
  }
  if (event.code === controls.softDrop) {
    keyHeldTimes.set(str(controls.softDrop), 0);
  }
}

function increaseKeyHeldTimes() {
  let rightTime = keyHeldTimes.get(str(controls.moveRight));
  let leftTime = keyHeldTimes.get(str(controls.moveLeft));
  let softTime = keyHeldTimes.get(str(controls.softDrop));

  if (rightTime !== 0) {
    keyHeldTimes.set(str(controls.moveRight), rightTime + 1);
  }
  if (leftTime !== 0) {
    keyHeldTimes.set(str(controls.moveLeft), leftTime + 1);
  }
  if (softTime !== 0) {
    keyHeldTimes.set(str(controls.softDrop), softTime + 1);
  }
  
  
}

function draw() {
  background(220);
  
  increaseKeyHeldTimes();

  if (theGame.exists) {
    theGame.handleDAS();
    theGame.handleSoftDrop();
    theGame.handleGravity();
  
    theGame.display.displayAll();
  }
}

// IJLOSTZ
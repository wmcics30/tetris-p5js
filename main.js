// Tetris In Javascript
// Luke Pawle-Fahy
// 4/15/2025
//
// Extra for Experts:
// - I don't think I've done anything Extra yet, but that will be the case when this is finished as my Final Project.

const MATRIX_WIDTH = 10;
const MATRIX_HEIGHT = 20;
const QUEUE_LENGTH = 5;

let tetrominoFigures;
let tetrominoOffsetData;
let levelGravities;

let tasks = [];
// {timer = Timer(), onExpiry = function, ...args};
// example: {timer = Timer(3000), onExpiry = movePieceLeft, args = idk}

class Tetromino {
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

  image(rotation = this.rotation, type = this.type) {
    return tetrominoFigures[type][rotation];
  }

}

class Tetris {
  // Setup
  constructor() {
    // Stats
    this.score = 0,
    this.level = 0,
    this.linesCleared = 0,

    // Tetromino Placement
    this.activePiece = null,
    this.heldPieceType = null,
    this.queue = [],
    this.matrix = createNewMatrix(),
    
    // Movement
    this.holdUsed = false,
    this.droppingHard = false,
    this.droppingSoft = false,
    this.delayedAutoStart = null,
    this.autoRepeat = true,
    
    // Lock Delay & Move Reset
    this.lockDelay = false,
    this.moveResetCounter = 0,

    // Game State
    this.active = true;
  }

  createNewMatrix() {
    let newMatrix = [];
    for (let i = 0; i < MATRIX_HEIGHT; i++) {
      newMatrix.push([]);
      for (let j = 0; j < MATRIX_WIDTH; i++) {
        newMatrix[i].push(null);
      }
    }
    return newMatrix;
  }

  // Active Piece Methods
  rotateTetromino(rotationDistance = 0) {
    if (this.activePiece !== null) {
      let newRotation = (this.activePiece.rotation + rotationDistance) % 4;
      switch (this.activePiece.type) {
      case 0:
        for (let i = 0; i < tetrominoOffsetData[1].table[0].length; i++) {
          let offsetX = tetrominoOffsetData[1].table[this.activePiece.rotation][i][0] - tetrominoOffsetData[1].table[newRotation][i][0];
          let offsetY = tetrominoOffsetData[1].table[this.activePiece.rotation][i][1] - tetrominoOffsetData[1].table[newRotation][i][1];
          if (!this.intersects(this.activePiece.x + offsetX, this.activePiece.y - offsetY, newRotation, undefined)) {
            this.activePiece.x += offsetX;
            this.activePiece.y -= offsetY;
            this.activePiece.rotation = newRotation;
            break;
          }
        }
        break;
      case 3:
        for (let i = 0; i < tetrominoOffsetData[2].table[0].length; i++) {
          let offsetX = tetrominoOffsetData[2].table[this.activePiece.rotation][i][0] - tetrominoOffsetData[2].table[newRotation][i][0];
          let offsetY = tetrominoOffsetData[2].table[this.activePiece.rotation][i][1] - tetrominoOffsetData[2].table[newRotation][i][1];
          if (!this.intersects(this.activePiece.x + offsetX, this.activePiece.y - offsetY, newRotation, undefined)) {
            this.activePiece.x += offsetX;
            this.activePiece.y -= offsetY;
            this.activePiece.rotation = newRotation;
            break;
          }
        }
        break;
      default:
        for (let i = 0; i < tetrominoOffsetData[0].table[0].length; i++) {
          let offsetX = tetrominoOffsetData[0].table[this.activePiece.rotation][i][0] - tetrominoOffsetData[0].table[newRotation][i][0];
          let offsetY = tetrominoOffsetData[0].table[this.activePiece.rotation][i][1] - tetrominoOffsetData[0].table[newRotation][i][1];
          if (!this.intersects(this.activePiece.x + offsetX, this.activePiece.y - offsetY, newRotation, undefined)) {
            this.activePiece.x += offsetX;
            this.activePiece.y -= offsetY;
            this.activePiece.rotation = newRotation;
            break;
          }
        }
        break;
      }
    }
    else {
      // Throw an error
    }
  }

  moveTetrominoX(dx = 0) {
    if (this.activePiece !== null && !this.intersects(this.activePiece.x + dx, undefined)) {
      this.activePiece.x += dx;
    }
  }

  moveTetrominoY(dy = 1) {
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

        if (this.shouldPlaceTetromino()) {
          this.placeTetromino();
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
      }
    }
  }

  placeTetromino(x = this.activePiece.x, y = this.activePiece.y, rotation = this.activePiece.rotation, type = this.activePiece.type) {
    if (this.canPlaceTetromino(x, y, rotation, type)) {
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (this.activePiece.image(rotation, type).includes(i * 5 + j)) {
            this.matrix[y + i][x + j] = this.activePiece.type;
          }
        }
      }

      this.clearLines();
      this.advanceNextQueue();
    }
  }

  holdTetromino() {
    if (this.activePiece !== null && !this.holdUsed) {
      [this.activePiece, this.heldPieceType] = [Tetromino(this.heldPieceType), this.activePiece.type];
    }
  }

  // Matrix Methods
  clearLines() {
    let lines = 0;

    // Iterate through each row, starting at the top
    for (let i = 0; i < this.matrix.length - 1; i++) {

      // If the row is full,
      if (this.matrix[i].indexOf(null) === -1) {
        lines += 1;

        // Iterate through rows, starting at the current row and ending one row below the top.
        for (let i1 = i; i1 > 1; i1--) {
          for (let j = 0; j < this.matrix[i1].length - 1; j++) {
            this.matrix[i1][j] = this.matrix[i1 - 1][j];
          }
        }

        // Top row = Array of length (length of top row) filled with null.
        this.matrix[0] = Array(this.matrix[0].length).fill(null);
      }
    }

    // Add Scoring & Total Line Count here
  }

  // Queue Methods
  advanceNextQueue() {
    if (this.activePiece === null) {
      this.activePiece = Tetromino(this.queue.shift());
    }
    else {
      // throw error or return -1
    }
  }

  refillNextQueue() {
    if (this.queue.length < QUEUE_LENGTH) {
      this.queue.push(...shuffle([0, 1, 2, 3, 4, 5, 6, 7]));
    }
  }

  // Conditionals
  shouldPlaceTetromino() {
    return this.droppingHard || this.moveResetCounter >= 15;
  }

  canPlaceTetromino(x = this.activePiece.x, y = this.activePiece.y, rotation = this.activePiece.rotation, type = this.activePiece.type) {
    return !this.intersects(x, y, rotation, type) && this.intersects(x, y + 1, rotation, type);
  }

  intersects(x = this.activePiece.x, y = this.activePiece.y, rotation = this.activePiece.rotation, type = this.activePiece.type) {
    let intersection = false;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (this.activePiece.image(rotation, type).includes(i * 5 + j)) {
          if (
            this.matrix[y + i][x + j] !== null ||
            y + i < 0 ||
            y + i > this.matrix.length - 1 ||
            x + j < 0 ||
            x + j > this.matrix[y + i].length - 1
          ) {
            intersection = true;
          }
        }
      }
    }
    return intersection;
  }
}

class Task {
  constructor(timer = 1000, onExpiry = () => {
    return -1;
  }, ...args ) {

  }
}

function preload() {
  tetrominoFigures = loadJSON('/data-tables/tetromino-figures.json');
  tetrominoOffsetData = loadJSON('/data-tables/offset-data.json');
  levelGravities = loadJSON('/data-tables/level-gravities.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);
}

function checkTimers() {
  // Checks each task, sees if its timer is expired. if so, executes the specified function.
  for (let task of tasks) {
    // In any case it should be onExpiry(..args), right? then the onExpiry function can redirect to whatever object you need. That sounds right.
    if (task.timer.expired()) {
      task.onExpiry(...task.args);
    }
  }
}

// IJLOSTZ
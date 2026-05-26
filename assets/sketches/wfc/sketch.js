// Source image
let sourceImage;
// Tiles extracted from the source image
let tiles;
// Number of cells along one dimension of the grid
let DIM = 40;
// Maximum depth for recursive checking of cells
let maxDepth = 5;
// Grid of cells for the Wave Function Collapse algorithm
let grid = [];

function preload() {
  sourceImage = loadImage("images/doodle.png");
}

function setup() {
  createCanvas(200, 200);

  // Extract tiles and calculate their adjacencies
  tiles = extractTiles(sourceImage);
  for (let tile of tiles) {
    tile.calculateNeighbors(tiles);
  }

  // Avvia la creazione della griglia per la prima volta
  initGrid();
}

// Funzione per inizializzare o resettare la griglia
function initGrid() {
  grid = []; // Svuota la griglia precedente
  let w = width / DIM;
  let count = 0;
  
  for (let j = 0; j < DIM; j++) {
    for (let i = 0; i < DIM; i++) {
      grid.push(new Cell(tiles, i * w, j * w, w, count));
      count++;
    }
  }

  // Perform initial wave function collapse step
  wfc();
}

// Se l'utente clicca, resetta manualmente da capo
function mousePressed() {
  loop(); 
  initGrid();
}

function draw() {
  // --- MODIFICA QUI: Rende lo sfondo trasparente ---
  clear(); 
  
  // Width of each cell on the grid
  let w = width / DIM;

  // Show the grid
  for (let i = 0; i < grid.length; i++) {
    grid[i].show();
    // Reset all cells to "unchecked"
    grid[i].checked = false;
  }

  // Run Wave Function Collapse!
  wfc();
}


// The Wave Function Collapse algorithm
function wfc() {

  // Make a (shallow) copy of grid
  let gridCopy = grid.slice();

  // Remove any collapsed cells from the copy
  gridCopy = gridCopy.filter((a) => !a.collapsed);

  // We're done if all cells are collapsed!
  if (gridCopy.length == 0) {
    noLoop();
    return;
  }

  // Sort cells by "entropy"
  gridCopy.sort((a, b) => {
    return a.options.length - b.options.length;
  });

  // Identify all cells with the lowest entropy
  let len = gridCopy[0].options.length;
  let stopIndex = 0;
  for (let i = 1; i < gridCopy.length; i++) {
    if (gridCopy[i].options.length > len) {
      stopIndex = i;
      break;
    }
  }
  if (stopIndex > 0) gridCopy.splice(stopIndex);

  // Randomly select one of the lowest entropy cells to collapse
  const cell = random(gridCopy);
  
  // Scegliamo un'opzione casuale dalle opzioni rimaste nella cella
  const pick = random(cell.options);
  
  // Gestione conflitto con riparazione locale
  if (pick == undefined) {
    console.log("Conflitto su cella " + cell.index + ". Tento riparazione locale...");
    
    cell.collapsed = false;
    cell.options = Array.from({length: tiles.length}, (_, k) => k);

    let index = cell.index;
    let i = floor(index % DIM);
    let j = floor(index / DIM);
    
    let neighborsIndices = [];
    if (i + 1 < DIM) neighborsIndices.push((i + 1) + j * DIM);
    if (i - 1 >= 0)  neighborsIndices.push((i - 1) + j * DIM);
    if (j + 1 < DIM) neighborsIndices.push(i + (j + 1) * DIM);
    if (j - 1 >= 0)  neighborsIndices.push(i + (j - 1) * DIM);

    for (let nIdx of neighborsIndices) {
      let neighbor = grid[nIdx];
      neighbor.collapsed = false;
      neighbor.options = Array.from({length: tiles.length}, (_, k) => k);
    }

    return;
  }
  
  // Se non c'è conflitto, procedi normalmente
  cell.collapsed = true;
  cell.options = [pick];

  // Propagate entropy reduction to neighbors
  reduceEntropy(grid, cell, 0);
}

function reduceEntropy(grid, cell, depth) {
  if (depth > maxDepth) return;
  if (cell.checked) return;
  cell.checked = true;

  let index = cell.index;
  let i = floor(index % DIM);
  let j = floor(index / DIM);

  // RIGHT
  if (i + 1 < DIM) {
    let rightCell = grid[i + 1 + j * DIM];
    let checked = checkOptions(cell, rightCell, TRIGHT);
    if (checked) {
      reduceEntropy(grid, rightCell, depth + 1);
    }
  }

  // LEFT
  if (i - 1 >= 0) {
    let leftCell = grid[i - 1 + j * DIM];
    let checked = checkOptions(cell, leftCell, TLEFT);
    if (checked) {
      reduceEntropy(grid, leftCell, depth + 1);
    }
  }

  // DOWN
  if (j + 1 < DIM) {
    let downCell = grid[i + (j + 1) * DIM];
    let checked = checkOptions(cell, downCell, TDOWN);
    if (checked) {
      reduceEntropy(grid, downCell, depth + 1);
    }
  }

  // UP
  if (j - 1 >= 0) {
    let upCell = grid[i + (j - 1) * DIM];
    let checked = checkOptions(cell, upCell, TUP);
    if (checked) {
      reduceEntropy(grid, upCell, depth + 1);
    }
  }
}

function checkOptions(cell, neighbor, direction) {
  if (neighbor && !neighbor.collapsed) {
    let validOptions = [];
    for (let option of cell.options) {
      validOptions = validOptions.concat(tiles[option].neighbors[direction]);
    }

    neighbor.options = neighbor.options.filter((elt) =>
      validOptions.includes(elt)
    );

    return true;
  } else {
    return false;
  }
}
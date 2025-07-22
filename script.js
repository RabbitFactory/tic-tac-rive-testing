let currentPlayer = 'X';
let gameActive = true;
let gameState = Array(9).fill("");

const winningCombos = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

function createBoard() {
  board.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', handleMove);
    board.appendChild(cell);
  }
  updateStatus();
}

async function handleMove(e) {
  const index = e.target.dataset.index;
  if (!gameActive || gameState[index] !== "") return;

  gameState[index] = currentPlayer;

  // Create canvas and load the appropriate Rive file
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  e.target.appendChild(canvas);

  const fileName = currentPlayer === 'X' ? 'cross.riv' : 'circle.riv';

  // Create Rive animation
  new Rive({
    src: fileName,
    canvas: canvas,
    autoplay: true,
  });

  if (checkWinner()) {
    status.textContent = `Player ${currentPlayer} wins!`;
    gameActive = false;
    return;
  }

  if (gameState.every(cell => cell !== "")) {
    status.textContent = "It's a draw!";
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateStatus();
}


function checkWinner() {
  return winningCombos.some(combo => {
    const [a, b, c] = combo;
    return gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c];
  });
}

function updateStatus() {
  status.textContent = `Player ${currentPlayer}'s turn`;
}

function restartGame() {
  currentPlayer = 'X';
  gameActive = true;
  gameState = Array(9).fill("");
  createBoard();
}

createBoard();

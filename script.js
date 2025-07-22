let peer;
let conn;
let isHost = false;
let mySymbol = "";
let currentPlayer = "X";
let gameActive = false;
let gameState = Array(9).fill("");

const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Initialize PeerJS
function initializePeer() {
  peer = new Peer();

  peer.on("open", (id) => {
    console.log("My peer ID is: " + id);
  });

  peer.on("connection", (connection) => {
    conn = connection;
    setupConnection();
    updateConnectionStatus("Connected! You are X (Host)", "status-connected");
    mySymbol = "X";
    isHost = true;
    showGameSection();
    createBoard();
  });

  peer.on("error", (err) => {
    console.error("PeerJS error:", err);
    updateConnectionStatus("Connection error", "status-disconnected");
  });
}

// Host game
document.getElementById("hostBtn").addEventListener("click", () => {
  if (!peer) initializePeer();

  peer.on("open", (id) => {
    document.getElementById("hostIdDisplay").value = id;
    document.getElementById("hostId").classList.remove("hidden");
    updateConnectionStatus("Waiting for friend to join...", "status-waiting");
  });
});

// Join game
document.getElementById("joinBtn").addEventListener("click", () => {
  const friendId = document.getElementById("friendId").value.trim();
  if (!friendId) return;

  if (!peer) initializePeer();

  peer.on("open", () => {
    conn = peer.connect(friendId);
    setupConnection();
    mySymbol = "O";
    isHost = false;
    updateConnectionStatus("Connected! You are O", "status-connected");
    showGameSection();
    createBoard();
  });
});

function setupConnection() {
  conn.on("open", () => {
    console.log("Connection established");
  });

  conn.on("data", (data) => {
    handleReceivedData(data);
  });

  conn.on("close", () => {
    updateConnectionStatus("Friend disconnected", "status-disconnected");
    gameActive = false;
  });
}

function handleReceivedData(data) {
  if (data.type === "move") {
    gameState = data.gameState;
    currentPlayer = data.currentPlayer;
    updateBoard();
    updateStatus();

    if (data.winner) {
      document.getElementById("status").textContent = data.winner;
      gameActive = false;
    } else if (data.draw) {
      document.getElementById("status").textContent = "It's a draw! 🤝";
      gameActive = false;
    }
  } else if (data.type === "restart") {
    restartGame();
  }
}

function sendMove(index) {
  const winner = checkWinner();
  const draw = !winner && gameState.every((cell) => cell !== "");

  conn.send({
    type: "move",
    gameState: gameState,
    currentPlayer: currentPlayer,
    winner: winner ? `Player ${winner} wins! 🎉` : null,
    draw: draw,
  });
}

function updateConnectionStatus(message, className) {
  const statusEl = document.getElementById("connectionStatus");
  statusEl.textContent = message;
  statusEl.className = `status-base ${className}`;
}

function showGameSection() {
  document.getElementById("connectionSection").classList.add("hidden");
  document.getElementById("gameSection").classList.remove("hidden");
}

function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", handleMove);
    board.appendChild(cell);
  }
  gameActive = true;
  updateStatus();
}

async function handleMove(e) {
  const index = parseInt(e.target.dataset.index);

  // Check if it's your turn and the game is active
  if (!gameActive || gameState[index] !== "" || currentPlayer !== mySymbol) {
    return;
  }

  // Make the move
  gameState[index] = currentPlayer;

  // Add Rive animation or fallback
  addAnimationToCell(e.target, currentPlayer);

  // Check for winner or draw
  const winner = checkWinner();
  if (winner) {
    document.getElementById("status").textContent = `Player ${winner} wins! 🎉`;
    gameActive = false;
  } else if (gameState.every((cell) => cell !== "")) {
    document.getElementById("status").textContent = "It's a draw! 🤝";
    gameActive = false;
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
  }

  // Send move to friend
  sendMove(index);
  updateStatus();
}

function addAnimationToCell(cell, symbol) {
  // Clear any existing content
  cell.innerHTML = "";

  // Create canvas for Rive animation
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 80;
  cell.appendChild(canvas);

  const fileName = symbol === "X" ? "cross.riv" : "circle.riv";

  try {
    new rive.Rive({
      src: fileName,
      canvas: canvas,
      autoplay: true,
      stateMachines: "State Machine 1",
    });
  } catch (error) {
    console.error("Error loading Rive animation:", error);
    // Fallback to text if Rive fails
    cell.removeChild(canvas);
    const fallback = document.createElement("div");
    fallback.classList.add("fallback", symbol.toLowerCase());
    fallback.textContent = symbol;
    cell.appendChild(fallback);
  }
}

function updateBoard() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    if (gameState[index] && !cell.hasChildNodes()) {
      addAnimationToCell(cell, gameState[index]);
    }
  });
}

function checkWinner() {
  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    if (
      gameState[a] &&
      gameState[a] === gameState[b] &&
      gameState[a] === gameState[c]
    ) {
      return gameState[a];
    }
  }
  return null;
}

function updateStatus() {
  if (!gameActive) return;

  const statusEl = document.getElementById("status");
  if (currentPlayer === mySymbol) {
    statusEl.textContent = "Your turn";
    statusEl.style.color = "#4CAF50";
  } else {
    statusEl.textContent = "Opponent's turn";
    statusEl.style.color = "#ff9800";
  }
}

function restartGame() {
  currentPlayer = "X";
  gameActive = true;
  gameState = Array(9).fill("");
  createBoard();

  // Notify friend about restart
  if (conn && conn.open) {
    conn.send({ type: "restart" });
  }
}

function copyToClipboard() {
  const hostIdInput = document.getElementById("hostIdDisplay");
  hostIdInput.select();
  document.execCommand("copy");
  alert("Game ID copied to clipboard!");
}

// Initialize on page load
window.addEventListener("load", () => {
  // PeerJS will be initialized when user clicks host or join
});

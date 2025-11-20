const gridSize = 4;
let board = [];
let score = 0;
let best = 0;
let history = [];

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const gridEl = document.getElementById('grid');
const tilesLayer = document.getElementById('tilesLayer');

// ------ Создание сетки ------
function initGrid() {
  while (gridEl.firstChild) gridEl.removeChild(gridEl.firstChild);
  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement('div');
    gridEl.appendChild(cell);
  }
}

// ------ Новая игра ------
function newGame() {
  board = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
  score = 0;
  history = [];
  updateScore();
  addRandom();
  addRandom();
  render();
}

// ------ Работа со счётом ------
function updateScore() {
  scoreEl.textContent = score;
  best = Math.max(best, score);
  bestEl.textContent = best;
}

// ------ Добавление случайной плитки ------
function addRandom() {
  let empty = [];
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      if (board[r][c] === 0) empty.push({ r, c });

  if (!empty.length) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

// ------ Отрисовка плиток ------
function render() {
  while (tilesLayer.firstChild) tilesLayer.removeChild(tilesLayer.firstChild);

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const val = board[r][c];
      if (val === 0) continue;

      const tile = document.createElement('div');
      tile.classList.add('tile');
      tile.textContent = String(val);

      const size = document.querySelector('.grid div').offsetWidth + 12;
      tile.style.width = tile.style.height = `${size - 12}px`;
      tile.style.left = `${c * size}px`;
      tile.style.top = `${r * size}px`;
      tile.style.background = getColor(val);

      tilesLayer.appendChild(tile);
    }
  }
}

function getColor(v) {
  const map = {
    2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b',
    128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
  };
  return map[v] || '#3c3a32';
}

// ------ Движение плиток ------
function move(dir) {
  saveHistory();

  if (dir === 'up') board = rotateLeft(board);
  else if (dir === 'down') board = rotateRight(board);
  else if (dir === 'right') board = flip(board);

  for (let r = 0; r < gridSize; r++) {
    let row = board[r].filter(v => v);
    for (let i = 0; i < row.length - 1; i++) {
      if (row[i] === row[i + 1]) {
        row[i] *= 2;
        score += row[i];
        row.splice(i + 1, 1);
      }
    }
    while (row.length < gridSize) row.push(0);
    board[r] = row;
  }

  if (dir === 'up') board = rotateRight(board);
  else if (dir === 'down') board = rotateLeft(board);
  else if (dir === 'right') board = flip(board);

  addRandom();
  updateScore();
  render();

  if (isGameOver()) showGameOver();
}

// ------ Вспомогательные трансформации ------
function rotateLeft(b) { return b[0].map((_, i) => b.map(r => r[i])).reverse(); }
function rotateRight(b) { return rotateLeft(rotateLeft(rotateLeft(b))); }
function flip(b) { return b.map(r => r.slice().reverse()); }

// ------ Проверка конца игры ------
function isGameOver() {
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      if (board[r][c] === 0) return false;

  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize - 1; c++)
      if (board[r][c] === board[r][c + 1]) return false;

  for (let c = 0; c < gridSize; c++)
    for (let r = 0; r < gridSize - 1; r++)
      if (board[r][c] === board[r + 1][c]) return false;

  return true;
}

// ------ История для Undo ------
function saveHistory() {
  const snapshot = board.map(r => r.slice());
  history.push({ board: snapshot, score });
  if (history.length > 20) history.shift();
}

function undo() {
  if (history.length === 0) return;
  const prev = history.pop();
  board = prev.board.map(r => r.slice());
  score = prev.score;
  updateScore();
  render();
}

// ------ Конец игры ------
const gameOverModal = document.getElementById('gameOverModal');
const gameOverMessage = document.getElementById('gameOverMessage');
const restartFromOverBtn = document.getElementById('restartFromOverBtn');

function showGameOver() {
  while (gameOverMessage.firstChild) gameOverMessage.removeChild(gameOverMessage.firstChild);
  gameOverMessage.appendChild(document.createTextNode('Игра окончена!'));
  gameOverModal.classList.remove('hidden');

  // Автоматический рестарт через небольшую задержку
  setTimeout(() => {
    gameOverModal.classList.add('hidden');
    newGame();
  }, 1200);
}

restartFromOverBtn.onclick = () => {
  gameOverModal.classList.add('hidden');
  newGame();();
};

// ------ События клавиатуры ------
window.addEventListener('keydown', e => {
  const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  if (keyMap[e.key]) move(keyMap[e.key]);
});

// ------ Мобильные кнопки ------
Array.from(document.querySelectorAll('.dir-btn')).forEach(btn => {
  btn.addEventListener('click', () => move(btn.dataset.dir));
});

// ------ Кнопки управления ------
undoBtn.addEventListener('click', undo);
newBtn.addEventListener('click', newGame);

// ------ Старт ------
initGrid();
newGame();

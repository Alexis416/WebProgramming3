const BOARD_SIZE = 4;
let board = [];
let score = 0;
let prevBoard = null;
let prevScore = 0;
let gameOver = false;
let leaderboardActive = false;

// HTML elements
const boardContainer = document.getElementById('game-board');
const scoreContainer = document.getElementById('score');
const undoButton = document.getElementById('undo');
const newGameButton = document.getElementById('new-game');
const showLeaderboardButton = document.getElementById('show-leaderboard');
const gameOverModal = document.getElementById('game-over-modal');
const gameOverMessage = document.getElementById('game-over-message');
const nameInput = document.getElementById('name-input');
const saveButton = document.getElementById('save-button');
const restartButton = document.getElementById('restart-button');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardTable = document.getElementById('leaderboard-table');
const closeLeaderboardButton = document.getElementById('close-leaderboard');
const mobileControls = document.getElementById('mobile-controls');

// Initialize
init();

function init() {
    // Setup event listeners
    document.addEventListener('keydown', handleKey);
    undoButton.addEventListener('click', undoMove);
    newGameButton.addEventListener('click', newGame);
    showLeaderboardButton.addEventListener('click', showLeaderboard);
    closeLeaderboardButton.addEventListener('click', hideLeaderboard);
    saveButton.addEventListener('click', saveResult);
    restartButton.addEventListener('click', newGame);
    // mobile buttons
    mobileControls.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            handleArrow(e.target.dataset.dir);
        }
    });

    // touch events for swipe
    let startX, startY;
    boardContainer.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        startX = touch.screenX;
        startY = touch.screenY;
    });
    boardContainer.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        const dx = touch.screenX - startX;
        const dy = touch.screenY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) handleMove('right');
            else if (dx < -30) handleMove('left');
        } else {
            if (dy > 30) handleMove('down');
            else if (dy < -30) handleMove('up');
        }
    });

    // Load saved game or start new
    loadState();
}

// Create empty board 4x4
function createEmptyBoard() {
    let b = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        b.push(Array(BOARD_SIZE).fill(0));
    }
    return b;
}

function newGame() {
    board = createEmptyBoard();
    score = 0;
    gameOver = false;
    prevBoard = null;
    prevScore = 0;
    saveButton.style.display = 'inline-block';
    nameInput.style.display = 'inline-block';
    gameOverMessage.textContent = 'Игра окончена!';
    nameInput.value = '';
    // spawn two initial tiles
    spawnTile();
    spawnTile();
    updateScore();
    renderBoard();
    undoButton.disabled = true;
    saveState();
    hideGameOver();
    hideLeaderboard();
}

function loadState() {
    const saved = localStorage.getItem('gameState');
    if (saved) {
        const state = JSON.parse(saved);
        board = state.board;
        score = state.score;
        renderBoard();
        updateScore();
        if (checkGameOver(false)) {
            showGameOver();
        }
        return;
    }
    newGame();
}

function saveState() {
    const state = { board: board, score: score };
    localStorage.setItem('gameState', JSON.stringify(state));
}

function spawnTile() {
    let empty = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                empty.push({r: r, c: c});
            }
        }
    }
    if (empty.length === 0) return;
    const idx = Math.floor(Math.random() * empty.length);
    const cell = empty[idx];
    const value = Math.random() < 0.9 ? 2 : 4;
    board[cell.r][cell.c] = value;
}

function spawnRandomTiles(count) {
    for (let i = 0; i < count; i++) {
        spawnTile();
    }
}

function renderBoard() {
    // Clear existing tiles
    while (boardContainer.firstChild) {
        boardContainer.removeChild(boardContainer.firstChild);
    }
    // create tile elements
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const val = board[r][c];
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (val !== 0) {
                tile.textContent = val;
                tile.classList.add('tile-' + val);
            }
            // position
            const gap = 10;
            const size = 80;
            tile.style.top = (r * (size + gap) + gap) + 'px';
            tile.style.left = (c * (size + gap) + gap) + 'px';
            boardContainer.appendChild(tile);
        }
    }
}

function updateScore() {
    scoreContainer.textContent = score;
}

function handleKey(event) {
    if (gameOver || leaderboardActive) return;
    if (event.key === 'ArrowLeft') handleMove('left');
    else if (event.key === 'ArrowRight') handleMove('right');
    else if (event.key === 'ArrowUp') handleMove('up');
    else if (event.key === 'ArrowDown') handleMove('down');
}

function handleArrow(dir) {
    if (gameOver || leaderboardActive) return;
    handleMove(dir);
}

function handleMove(direction) {
    let moved = false;
    // copy current board for undo
    const oldBoard = board.map(row => row.slice());
    const oldScore = score;
    if (direction === 'left') {
        moved = moveLeft();
    } else if (direction === 'right') {
        moved = moveRight();
    } else if (direction === 'up') {
        moved = moveUp();
    } else if (direction === 'down') {
        moved = moveDown();
    }
    if (moved) {
        prevBoard = oldBoard.map(row => row.slice());
        prevScore = oldScore;
        undoButton.disabled = false;
        // spawn 1 or 2 tiles
        const count = Math.random() < 0.5 ? 1 : 2;
        spawnRandomTiles(count);
        updateScore();
        renderBoard();
        if (checkGameOver(true)) {
            showGameOver();
        }
        saveState();
    }
}

function moveLeft() {
    let moved = false;
    for (let r = 0; r < BOARD_SIZE; r++) {
        let row = board[r];
        const [newRow, gained, didMove] = compressCombine(row);
        board[r] = newRow;
        if (didMove) {
            score += gained;
            moved = true;
        }
    }
    return moved;
}

function moveRight() {
    let moved = false;
    for (let r = 0; r < BOARD_SIZE; r++) {
        let row = board[r].slice().reverse();
        const [newRow, gained, didMove] = compressCombine(row);
        newRow.reverse();
        board[r] = newRow;
        if (didMove) {
            score += gained;
            moved = true;
        }
    }
    return moved;
}

function moveUp() {
    let moved = false;
    for (let c = 0; c < BOARD_SIZE; c++) {
        let col = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            col.push(board[r][c]);
        }
        const [newCol, gained, didMove] = compressCombine(col);
        for (let r = 0; r < BOARD_SIZE; r++) {
            board[r][c] = newCol[r];
        }
        if (didMove) {
            score += gained;
            moved = true;
        }
    }
    return moved;
}

function moveDown() {
    let moved = false;
    for (let c = 0; c < BOARD_SIZE; c++) {
        let col = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            col.push(board[r][c]);
        }
        col.reverse();
        const [newCol, gained, didMove] = compressCombine(col);
        newCol.reverse();
        for (let r = 0; r < BOARD_SIZE; r++) {
            board[r][c] = newCol[r];
        }
        if (didMove) {
            score += gained;
            moved = true;
        }
    }
    return moved;
}

function compressCombine(arr) {
    let moved = false;
    let totalGained = 0;
    let row = arr.slice();
    do {
        // compress non-zeros
        let filtered = row.filter(val => val !== 0);
        while (filtered.length < BOARD_SIZE) {
            filtered.push(0);
        }
        if (!arraysEqual(filtered, row)) {
            row = filtered;
            moved = true;
        }
        // combine
        let combined = false;
        for (let i = 0; i < BOARD_SIZE - 1; i++) {
            if (row[i] !== 0 && row[i] === row[i+1]) {
                row[i] *= 2;
                totalGained += row[i];
                row[i+1] = 0;
                combined = true;
                moved = true;
            }
        }
        if (!combined) break;
    } while (true);
    // final compress after loop
    let filtered = row.filter(val => val !== 0);
    while (filtered.length < BOARD_SIZE) {
        filtered.push(0);
    }
    if (!arraysEqual(filtered, row)) {
        row = filtered;
        moved = true;
    }
    return [row, totalGained, moved];
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((v,i) => v === b[i]);
}

function checkGameOver(showModal) {
    // check any empty
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                return false;
            }
        }
    }
    // no empties: check adjacent equal
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE - 1; c++) {
            if (board[r][c] === board[r][c+1]) return false;
        }
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
        for (let r = 0; r < BOARD_SIZE - 1; r++) {
            if (board[r][c] === board[r+1][c]) return false;
        }
    }
    // no moves left
    gameOver = true;
    undoButton.disabled = true;
    if (showModal) {
        showGameOver();
    }
    return true;
}

function showGameOver() {
    mobileControls.style.display = 'none';
    gameOverModal.classList.remove('hidden');
}

function hideGameOver() {
    mobileControls.style.display = '';
    gameOverModal.classList.add('hidden');
}

function saveResult() {
    const name = nameInput.value.trim();
    if (!name) return;
    saveButton.style.display = 'none';
    nameInput.style.display = 'none';
    gameOverMessage.textContent = 'Ваш рекорд сохранен!';
    // add to leaderboard
    const entry = { name: name, score: score, date: new Date().toLocaleDateString() };
    let boardRecords = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    boardRecords.push(entry);
    // sort descending by score
    boardRecords.sort((a,b) => b.score - a.score);
    // keep top 10
    boardRecords = boardRecords.slice(0, 10);
    localStorage.setItem('leaderboard', JSON.stringify(boardRecords));
    renderLeaderboard();
}

function showLeaderboard() {
    leaderboardActive = true;
    mobileControls.style.display = 'none';
    renderLeaderboard();
    leaderboardModal.classList.remove('hidden');
}

function hideLeaderboard() {
    leaderboardActive = false;
    mobileControls.style.display = '';
    leaderboardModal.classList.add('hidden');
}

function renderLeaderboard() {
    // Clear rows except header
    while (leaderboardTable.rows.length > 1) {
        leaderboardTable.deleteRow(1);
    }
    const boardRecords = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    for (let rec of boardRecords) {
        const row = leaderboardTable.insertRow();
        const cellName = row.insertCell();
        const cellScore = row.insertCell();
        const cellDate = row.insertCell();
        cellName.textContent = rec.name;
        cellScore.textContent = rec.score;
        cellDate.textContent = rec.date;
    }
}

function undoMove() {
    if (!prevBoard) return;
    board = prevBoard.map(row => row.slice());
    score = prevScore;
    renderBoard();
    updateScore();
    prevBoard = null;
    prevScore = 0;
    undoButton.disabled = true;
    saveState();
}


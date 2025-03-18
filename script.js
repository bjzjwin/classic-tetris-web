// 游戏常量
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

// 方块形状定义
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]], // L
    [[1, 1], [1, 1]], // O
    [[0, 1, 1], [1, 1, 0]], // S
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]]  // Z
];

// 游戏状态
let canvas, ctx;
let nextCanvas, nextCtx;
let gameLoop;
let score = 0;
let level = 1;
let gameBoard = [];
let currentPiece = null;
let nextPiece = null;

// 初始化游戏
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('nextCanvas');
    nextCtx = nextCanvas.getContext('2d');

    // 设置画布大小
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    nextCanvas.width = 4 * BLOCK_SIZE;
    nextCanvas.height = 4 * BLOCK_SIZE;

    // 初始化游戏板
    gameBoard = Array(ROWS).fill().map(() => Array(COLS).fill(0));

    // 绑定事件
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeyPress);
}

// 创建新方块
function createPiece() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
        shape,
        color,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

// 绘制方块
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

// 绘制游戏板
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameBoard[y][x]) {
                drawBlock(x, y, gameBoard[y][x]);
            }
        }
    }
}

// 绘制当前方块
function drawPiece() {
    if (!currentPiece) return;
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(currentPiece.x + x, currentPiece.y + y, currentPiece.color);
            }
        });
    });
}

// 绘制下一个方块
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return;
    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                nextCtx.fillStyle = nextPiece.color;
                nextCtx.fillRect(
                    x * BLOCK_SIZE + BLOCK_SIZE,
                    y * BLOCK_SIZE + BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        });
    });
}

// 碰撞检测
function isCollision(piece, moveX = 0, moveY = 0) {
    return piece.shape.some((row, y) => {
        return row.some((value, x) => {
            if (!value) return false;
            const newX = piece.x + x + moveX;
            const newY = piece.y + y + moveY;
            return (
                newX < 0 ||
                newX >= COLS ||
                newY >= ROWS ||
                (newY >= 0 && gameBoard[newY][newX])
            );
        });
    });
}

// 合并方块到游戏板
function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                gameBoard[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
            }
        });
    });
}

// 清除完整的行
function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (gameBoard[y].every(cell => cell)) {
            gameBoard.splice(y, 1);
            gameBoard.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        document.getElementById('score').textContent = score;
        if (score >= level * 1000) {
            level++;
            document.getElementById('level').textContent = level;
        }
    }
}

// 游戏主循环
function gameStep() {
    if (!currentPiece) {
        currentPiece = nextPiece || createPiece();
        nextPiece = createPiece();
        drawNextPiece();
        if (isCollision(currentPiece)) {
            gameOver();
            return;
        }
    }

    if (!isCollision(currentPiece, 0, 1)) {
        currentPiece.y++;
    } else {
        mergePiece();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();
        if (isCollision(currentPiece)) {
            gameOver();
            return;
        }
    }

    drawBoard();
    drawPiece();
}

// 处理键盘事件
function handleKeyPress(event) {
    if (!currentPiece) return;

    switch (event.keyCode) {
        case 37: // 左箭头
            if (!isCollision(currentPiece, -1, 0)) {
                currentPiece.x--;
            }
            break;
        case 39: // 右箭头
            if (!isCollision(currentPiece, 1, 0)) {
                currentPiece.x++;
            }
            break;
        case 40: // 下箭头
            if (!isCollision(currentPiece, 0, 1)) {
                currentPiece.y++;
            }
            break;
        case 38: // 上箭头
            const rotated = currentPiece.shape[0].map((_, i) =>
                currentPiece.shape.map(row => row[i]).reverse()
            );
            const previousShape = currentPiece.shape;
            currentPiece.shape = rotated;
            if (isCollision(currentPiece)) {
                currentPiece.shape = previousShape;
            }
            break;
    }
    drawBoard();
    drawPiece();
}

// 开始游戏
function startGame() {
    // 重置游戏状态
    gameBoard = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    document.getElementById('score').textContent = '0';
    document.getElementById('level').textContent = '1';
    
    // 清除之前的游戏循环
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    // 开始新的游戏循环
    currentPiece = null;
    gameLoop = setInterval(() => {
        gameStep();
    }, 1000 / level);
}

// 游戏结束
function gameOver() {
    clearInterval(gameLoop);
    alert(`游戏结束！得分：${score}`);
}

// 初始化游戏
init();
let currentLevel = 0;
let gameMap = [];
let initialGameMap = []; // 储存卡关初始的状态
let playerPosition = { x: 0, y: 0 };
let originalTargets = []; // 存储原始目标点位置
let history = [];
let miwuMap = []; // 新增：用于存储迷雾模式下的地图状态

// 页面切换
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'levels') {
        initLevelSelect();
    }
}

// 初始化关卡选择
function initLevelSelect() {
    const container = document.getElementById('level-list');
    container.innerHTML = '';
    levels.forEach((_, i) => {
        const btn = document.createElement('div');
        btn.className = 'level-btn';
        btn.textContent = `关卡 ${i + 1}`;
        btn.onclick = () => loadLevel(i);
        container.appendChild(btn);
    });
}

function loadLevel(levelIndex) {
    currentLevel = levelIndex;
    const levelData = levels[levelIndex];
    initialGameMap = JSON.parse(JSON.stringify(levelData));
    gameMap = JSON.parse(JSON.stringify(initialGameMap));
    miwuMap = Array.from({ length: gameMap.length }, () => Array(gameMap[0].length).fill(0)); // 初始化迷雾地图为全迷雾
    originalTargets = [];

    // 记录原始目标点位置
    gameMap.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 3) {
                originalTargets.push({ x, y });
            }
        });
    });

    // 查找玩家位置
    for (let y = 0; y < gameMap.length; y++) {
        for (let x = 0; x < gameMap[y].length; x++) {
            if (gameMap[y][x] === 4) {
                initialPlayerPositon = { x, y };
                playerPosition = { x, y };
            }
        }
    }

    // 清空历史记录
    history = [];
    showPage('game');
    initGame();
}

// 初始化游戏界面
function initGame() {
    const container = document.getElementById('game-container');
    const cols = gameMap[0].length;

    container.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    container.innerHTML = '';

    gameMap.forEach((row, y) => {
        row.forEach((cell, x) => {
            const div = document.createElement('div');
            div.className = 'cell';
            const isTarget = originalTargets.some(t => t.x === x && t.y === y);

            // 处理迷雾模式下的显示
            if (miwuMap[y][x] === 0) {
                div.className += ' fog';
                div.textContent = '';
            } else {
                // 处理组合状态
                if (cell === 4 && isTarget) {
                    div.className += ' player target';
                    div.textContent = '我';
                } else if (cell === 2 && isTarget) {
                    div.className += ' box-on-target';
                    div.textContent = '※';
                } else {
                    switch (cell) {
                        case 1:
                            div.className += ' wall';
                            div.textContent = '墙';
                            break;
                        case 2:
                            div.className += ' box';
                            div.textContent = '箱';
                            break;
                        case 3:
                            div.className += ' target';
                            div.textContent = '★';
                            break;
                        case 4:
                            div.className += ' player';
                            div.textContent = '我';
                            break;
                        default:
                            div.textContent = '';
                    }
                }
            }
            container.appendChild(div);
        });
    });
    adjustCellSize();
}
function adjustCellSize() {
    const container = document.querySelector('.game-container');
    
    // 动态获取网格列数（根据实际渲染的列数）
    const columnCount = getComputedStyle(container)
        .gridTemplateColumns
        .split(' ')
        .length;

    // 自动检测间隙尺寸（需与CSS中设置的gap一致）
    const gap = parseFloat(getComputedStyle(container).gap) || 2;
    
    // 计算自适应尺寸
    const containerWidth = container.clientWidth;
    const cellSize = (containerWidth - (columnCount - 1) * gap) / columnCount;
    
    // 设置CSS变量（同时约束最大尺寸）
    container.style.setProperty('--cell-size', `${Math.min(cellSize, 60)}px`);
}

// 添加MutationObserver监听网格变化
const observer = new MutationObserver(adjustCellSize);
observer.observe(document.querySelector('.game-container'), {
    childList: true,
    subtree: true
});

// 保持原有的resize监听
window.addEventListener('resize', adjustCellSize);
adjustCellSize();
// 移动处理函数
function move(dx, dy) {
    // 保存状态
    history.push({
        map: JSON.parse(JSON.stringify(gameMap)),
        pos: {...playerPosition}
    });

    // 定义历史记录保存10步
    if (history.length > 10) history.shift();
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;

    // 边界检查
    if (newY < 0 || newY >= gameMap.length || newX < 0 || newX >= gameMap[0].length) return;

    const targetCell = gameMap[newY][newX];

    // 碰撞检测
    if (targetCell === 1) return; // 撞墙

    // 推动箱子逻辑
    if (targetCell === 2) {
        const boxNewX = newX + dx;
        const boxNewY = newY + dy;

        // 箱子边界检查
        if (boxNewY < 0 || boxNewY >= gameMap.length ||
            boxNewX < 0 || boxNewX >= gameMap[0].length) return;
        if (gameMap[boxNewY][boxNewX] === 1 || gameMap[boxNewY][boxNewX] === 2) return;

        // 移动箱子
        gameMap[newY][newX] = 0;
        gameMap[boxNewY][boxNewX] = 2;
    }

    // 移动玩家
    const wasOnTarget = originalTargets.some(t =>
        t.x === playerPosition.x && t.y === playerPosition.y
    );
    gameMap[playerPosition.y][playerPosition.x] = wasOnTarget ? 3 : 0;
    playerPosition.x = newX;
    playerPosition.y = newY;
    gameMap[newY][newX] = 4;

    // 新增：更新迷雾地图，显示玩家周围的格子
    updateMiwuMap();

    checkWin();
    initGame();
}

// 新增：更新迷雾地图，显示玩家周围的格子
function updateMiwuMap() {
    const range = 2; // 玩家周围的格子范围
    for (let y = Math.max(0, playerPosition.y - range); y <= Math.min(gameMap.length - 1, playerPosition.y + range); y++) {
        for (let x = Math.max(0, playerPosition.x - range); x <= Math.min(gameMap[0].length - 1, playerPosition.x + range); x++) {
            miwuMap[y][x] = 1;
        }
    }
}

// 撤销参数
function undo() {
    if (history.length === 0) return;
    const state = history.pop();
    gameMap = state.map;
    playerPosition = state.pos;
    initGame();
}

// 重置参数
function resetLevel() {
    if (confirm("确定要重置当前关卡吗？")) {
        gameMap = JSON.parse(JSON.stringify(initialGameMap));
        playerPosition = {...initialPlayerPositon};
        history = [];
        miwuMap = Array.from({ length: gameMap.length }, () => Array(gameMap[0].length).fill(0)); // 重置迷雾地图
        initGame();
    }
}

// 胜利检测
function checkWin() {
    const win = originalTargets.every(t =>
        gameMap[t.y][t.x] === 2
    );

    if (win) {
        setTimeout(() => {
            const totalLevels = levels.length;

            if (currentLevel < totalLevels - 1) {
                // 自动加载下一关
                const nextLevel = currentLevel + 1;
                if (confirm(`🎉 关卡 ${currentLevel + 1} 通过！\n是否进入第 ${nextLevel + 1} 关？`)) {
                    loadLevel(nextLevel);
                } else {
                    showPage('levels');
                }
            } else {
                if (confirm('🎉 恭喜！你已通过所有关卡！\n是否返回主页？')) {
                    showPage('home');
                } else {
                    showPage('levels');
                }
            }
        }, 100);
    }
}

// 事件监听
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': move(0, -1); break;
        case 'ArrowDown': move(0, 1); break;
        case 'ArrowLeft': move(-1, 0); break;
        case 'ArrowRight': move(1, 0); break;
    }
});

// 初始化关卡选择
initLevelSelect();

// 修改迷雾模式按钮的点击事件
function goTomiwuPage() {
    // 这里可以添加迷雾模式的初始化逻辑，比如重新加载当前关卡进入迷雾模式
    loadLevel(currentLevel);
}

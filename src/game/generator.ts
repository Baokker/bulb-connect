import { DIRECTIONS, OPPOSITE, rotateClockwise, type Direction } from './directions';
import type { Board, GameState, Tile, TileKind } from './types';
import { ROWS, COLS, BULB_COUNT } from './types';
import { applyPowered, checkWin } from './power';

export type RandomFn = () => number; // 返回 [0, 1)

type Cell = { row: number; col: number };

const DELTAS: Record<Direction, [number, number]> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};

const key = (r: number, c: number) => `${r},${c}`;

function emptyConnections(): Map<string, Direction[]> {
  const m = new Map<string, Direction[]>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      m.set(key(r, c), []);
    }
  }
  return m;
}

function neighborsOf(r: number, c: number): { dir: Direction; cell: Cell }[] {
  const result: { dir: Direction; cell: Cell }[] = [];
  for (const dir of DIRECTIONS) {
    const [dr, dc] = DELTAS[dir];
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      result.push({ dir, cell: { row: nr, col: nc } });
    }
  }
  return result;
}

/**
 * 受约束的随机深度优先生成树：覆盖全部 25 格，24 条正交边，无环全连通。
 */
function generateSpanningTree(rng: RandomFn): Map<string, Direction[]> {
  const connections = emptyConnections();
  const visited = new Set<string>();

  const startR = Math.floor(rng() * ROWS);
  const startC = Math.floor(rng() * COLS);
  visited.add(key(startR, startC));
  const stack: Cell[] = [{ row: startR, col: startC }];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const candidates = neighborsOf(current.row, current.col).filter(
      ({ cell }) => !visited.has(key(cell.row, cell.col)),
    );
    if (candidates.length === 0) {
      stack.pop();
      continue;
    }
    const picked = candidates[Math.floor(rng() * candidates.length)];
    connections.get(key(current.row, current.col))!.push(picked.dir);
    connections
      .get(key(picked.cell.row, picked.cell.col))!
      .push(OPPOSITE[picked.dir]);
    visited.add(key(picked.cell.row, picked.cell.col));
    stack.push(picked.cell);
  }

  return connections;
}

function countLeaves(connections: Map<string, Direction[]>): number {
  let count = 0;
  for (const conns of connections.values()) {
    if (conns.length === 1) count++;
  }
  return count;
}

// ---- 梳形保底树 ----

function rotate90(connections: Map<string, Direction[]>): Map<string, Direction[]> {
  const result = emptyConnections();
  for (const [k, conns] of connections) {
    const [r, c] = k.split(',').map(Number);
    const nr = c;
    const nc = ROWS - 1 - r;
    result.set(key(nr, nc), conns.map(rotateClockwise));
  }
  return result;
}

function mirrorHorizontal(
  connections: Map<string, Direction[]>,
): Map<string, Direction[]> {
  const result = emptyConnections();
  for (const [k, conns] of connections) {
    const [r, c] = k.split(',').map(Number);
    const nc = COLS - 1 - c;
    result.set(
      key(r, nc),
      conns.map((d) => (d === 'E' ? 'W' : d === 'W' ? 'E' : d)),
    );
  }
  return result;
}

/**
 * 梳形覆盖树：一列纵向主干，每行向对侧延伸一条横向支路，五个支路端点为叶子。
 * 覆盖 25 格，恰有 5 个叶子。生成后随机旋转或镜像以增加多样性。
 */
function combTree(rng: RandomFn): Map<string, Direction[]> {
  const connections = emptyConnections();

  // 纵向主干（第 0 列）
  for (let r = 0; r < ROWS - 1; r++) {
    connections.get(key(r, 0))!.push('S');
    connections.get(key(r + 1, 0))!.push('N');
  }
  // 每行横向支路（从第 0 列延伸到第 4 列）
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      connections.get(key(r, c))!.push('E');
      connections.get(key(r, c + 1))!.push('W');
    }
  }

  let result = connections;
  const rotations = Math.floor(rng() * 4);
  for (let i = 0; i < rotations; i++) result = rotate90(result);
  if (Math.floor(rng() * 2) === 1) result = mirrorHorizontal(result);
  return result;
}

// ---- 解状态构造 ----

function degreeToKind(degree: number, conns: Direction[]): TileKind {
  if (degree === 4) return 'cross';
  if (degree === 3) return 'tee';
  if (degree === 2) {
    const isStraight =
      (conns.includes('N') && conns.includes('S')) ||
      (conns.includes('E') && conns.includes('W'));
    return isStraight ? 'straight' : 'corner';
  }
  return 'bulb'; // degree 1
}

/**
 * 生成一局的解状态：先尝试随机 DFS 树（要求恰 5 个叶子），失败则用梳形保底。
 * 返回解棋盘（所有格与电源连通）和电源位置。
 */
export function generateSolution(
  rng: RandomFn = Math.random,
): { board: Board; powerPos: Cell } {
  let connections: Map<string, Direction[]> | null = null;

  for (let attempt = 0; attempt < 200; attempt++) {
    const tree = generateSpanningTree(rng);
    if (countLeaves(tree) === BULB_COUNT) {
      connections = tree;
      break;
    }
  }
  if (!connections) {
    connections = combTree(rng);
  }

  // 从非叶子节点中选电源
  const nonLeaves: Cell[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (connections.get(key(r, c))!.length !== 1) {
        nonLeaves.push({ row: r, col: c });
      }
    }
  }
  const powerCell = nonLeaves[Math.floor(rng() * nonLeaves.length)];

  const board: Board = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < COLS; c++) {
      const conns = connections.get(key(r, c))!;
      const isPower = r === powerCell.row && c === powerCell.col;
      const kind: TileKind = isPower ? 'power' : degreeToKind(conns.length, conns);
      row.push({
        id: `tile-${r}-${c}`,
        kind,
        connections: [...conns],
        powered: false,
      });
    }
    board.push(row);
  }

  return { board, powerPos: powerCell };
}

function isWinning(board: Board): boolean {
  return checkWin(applyPowered(board));
}

/**
 * 深拷贝解状态，将每个非电源格随机旋转 0～3 次。若结果已胜利则重新打乱。
 */
export function shuffleBoard(
  solution: Board,
  rng: RandomFn = Math.random,
): Board {
  for (let attempt = 0; attempt < 100; attempt++) {
    const board = solution.map((row) =>
      row.map((tile) => ({
        ...tile,
        connections: [...tile.connections],
      })),
    );
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = board[r][c];
        if (tile.kind === 'power') continue;
        const rotations = Math.floor(rng() * 4);
        for (let i = 0; i < rotations; i++) {
          tile.connections = tile.connections.map(rotateClockwise);
        }
      }
    }
    if (!isWinning(board)) return board;
  }
  // 理论上不会到达：5 个单接口灯泡随机指向正确方向的概率极低
  return solution.map((row) =>
    row.map((tile) => ({ ...tile, connections: [...tile.connections] })),
  );
}

/**
 * 生成一局完整游戏状态：解 → 打乱 → 计算初始通电与胜利状态。
 * initialBoard 深拷贝，不与当前棋盘共享格子对象。
 */
export function generateGame(rng: RandomFn = Math.random): GameState {
  const { board: solution } = generateSolution(rng);
  const initial = shuffleBoard(solution, rng);
  const poweredInitial = applyPowered(initial);
  return {
    board: poweredInitial,
    initialBoard: initial.map((row) =>
      row.map((t) => ({ ...t, connections: [...t.connections] })),
    ),
    won: checkWin(poweredInitial),
  };
}

import { DIRECTIONS, OPPOSITE, rotateClockwise, type Direction } from './directions';
import type { Board, GameState, Tile, TileKind, Difficulty } from './types';
import { DIFFICULTIES } from './types';
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

function emptyConnections(rows: number, cols: number): Map<string, Direction[]> {
  const m = new Map<string, Direction[]>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      m.set(key(r, c), []);
    }
  }
  return m;
}

function neighborsOf(
  r: number,
  c: number,
  rows: number,
  cols: number,
): { dir: Direction; cell: Cell }[] {
  const result: { dir: Direction; cell: Cell }[] = [];
  for (const dir of DIRECTIONS) {
    const [dr, dc] = DELTAS[dir];
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      result.push({ dir, cell: { row: nr, col: nc } });
    }
  }
  return result;
}

/**
 * 受约束的随机深度优先生成树：覆盖全部格子，正交边，无环全连通。
 */
function generateSpanningTree(
  rng: RandomFn,
  rows: number,
  cols: number,
): Map<string, Direction[]> {
  const connections = emptyConnections(rows, cols);
  const visited = new Set<string>();

  const startR = Math.floor(rng() * rows);
  const startC = Math.floor(rng() * cols);
  visited.add(key(startR, startC));
  const stack: Cell[] = [{ row: startR, col: startC }];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const candidates = neighborsOf(current.row, current.col, rows, cols).filter(
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

function rotate90(
  connections: Map<string, Direction[]>,
  size: number,
): Map<string, Direction[]> {
  const result = emptyConnections(size, size);
  for (const [k, conns] of connections) {
    const [r, c] = k.split(',').map(Number);
    const nr = c;
    const nc = size - 1 - r;
    result.set(key(nr, nc), conns.map(rotateClockwise));
  }
  return result;
}

function mirrorHorizontal(
  connections: Map<string, Direction[]>,
  cols: number,
): Map<string, Direction[]> {
  const result = emptyConnections(connections.size / cols, cols);
  for (const [k, conns] of connections) {
    const [r, c] = k.split(',').map(Number);
    const nc = cols - 1 - c;
    result.set(
      key(r, nc),
      conns.map((d) => (d === 'E' ? 'W' : d === 'W' ? 'E' : d)),
    );
  }
  return result;
}

/**
 * 梳形覆盖树：一列纵向主干，每行向对侧延伸一条横向支路，支路端点为叶子。
 * 覆盖 rows×cols 格，恰有 rows 个叶子。生成后随机旋转或镜像。
 * 适用于方形棋盘（rows === cols）。
 */
function combTree(
  rng: RandomFn,
  rows: number,
  cols: number,
): Map<string, Direction[]> {
  const connections = emptyConnections(rows, cols);

  // 纵向主干（第 0 列）
  for (let r = 0; r < rows - 1; r++) {
    connections.get(key(r, 0))!.push('S');
    connections.get(key(r + 1, 0))!.push('N');
  }
  // 每行横向支路（从第 0 列延伸到最后一列）
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      connections.get(key(r, c))!.push('E');
      connections.get(key(r, c + 1))!.push('W');
    }
  }

  let result = connections;
  if (rows === cols) {
    const rotations = Math.floor(rng() * 4);
    for (let i = 0; i < rotations; i++) result = rotate90(result, rows);
  }
  if (Math.floor(rng() * 2) === 1) result = mirrorHorizontal(result, cols);
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

function deepCopyBoard(board: Board): Board {
  return board.map((row) =>
    row.map((t) => ({ ...t, connections: [...t.connections] })),
  );
}

/**
 * 生成一局的解状态：先尝试随机 DFS 树（要求恰 bulbCount 个叶子），失败则用梳形保底。
 */
export function generateSolution(
  rng: RandomFn = Math.random,
  rows = 5,
  cols = 5,
  bulbCount = 5,
): { board: Board; powerPos: Cell } {
  let connections: Map<string, Direction[]> | null = null;

  const maxAttempts = 500;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tree = generateSpanningTree(rng, rows, cols);
    if (countLeaves(tree) === bulbCount) {
      connections = tree;
      break;
    }
  }
  if (!connections) {
    connections = combTree(rng, rows, cols);
  }

  // 从非叶子节点中选电源
  const nonLeaves: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (connections.get(key(r, c))!.length !== 1) {
        nonLeaves.push({ row: r, col: c });
      }
    }
  }
  const powerCell = nonLeaves[Math.floor(rng() * nonLeaves.length)];

  const board: Board = [];
  for (let r = 0; r < rows; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < cols; c++) {
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
  rows = 5,
  cols = 5,
): Board {
  for (let attempt = 0; attempt < 100; attempt++) {
    const board = deepCopyBoard(solution);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
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
  return deepCopyBoard(solution);
}

/**
 * 生成一局完整游戏状态。
 */
export function generateGame(
  rng: RandomFn = Math.random,
  difficulty: Difficulty = 'easy',
): GameState {
  const cfg = DIFFICULTIES[difficulty];
  const { board: solution } = generateSolution(
    rng,
    cfg.rows,
    cfg.cols,
    cfg.bulbCount,
  );
  const initial = shuffleBoard(solution, rng, cfg.rows, cfg.cols);
  const poweredInitial = applyPowered(initial);
  return {
    board: poweredInitial,
    initialBoard: deepCopyBoard(initial),
    solutionBoard: applyPowered(solution),
    won: false,
    difficulty,
    started: false,
    completedSeconds: null,
    showingSolution: false,
  };
}

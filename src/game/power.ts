import type { Board } from './types';
import { OPPOSITE, type Direction } from './directions';

const DELTAS: Record<Direction, [number, number]> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};

export function findPower(board: Board): { row: number; col: number } | null {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c].kind === 'power') return { row: r, col: c };
    }
  }
  return null;
}

/**
 * 从电源格开始按相互匹配的接口广度优先遍历，返回通电标记矩阵。
 */
export function computePowered(board: Board): boolean[][] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const powered: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false),
  );

  const powerPos = findPower(board);
  if (!powerPos) return powered;

  const queue: [number, number][] = [[powerPos.row, powerPos.col]];
  powered[powerPos.row][powerPos.col] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const tile = board[r][c];
    for (const dir of tile.connections) {
      const [dr, dc] = DELTAS[dir];
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (powered[nr][nc]) continue;
      const neighbor = board[nr][nc];
      if (neighbor.connections.includes(OPPOSITE[dir])) {
        powered[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }

  return powered;
}

/**
 * 返回一个新棋盘，其中每个格子的 powered 字段已根据遍历结果更新。
 */
export function applyPowered(board: Board): Board {
  const powered = computePowered(board);
  return board.map((row, r) =>
    row.map((tile, c) => ({ ...tile, powered: powered[r][c] })),
  );
}

/**
 * 所有灯泡格均通电时为胜利；未通电的非灯泡格不阻止胜利。
 */
export function checkWin(board: Board): boolean {
  for (const row of board) {
    for (const tile of row) {
      if (tile.kind === 'bulb' && !tile.powered) return false;
    }
  }
  return true;
}

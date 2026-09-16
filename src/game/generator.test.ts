import { describe, it, expect } from 'vitest';
import { generateSolution, shuffleBoard, generateGame } from './generator';
import { computePowered, applyPowered, checkWin } from './power';
import { ROWS, COLS, BULB_COUNT } from './types';
import { mulberry32 } from '../test-utils';

function countKind(board: ReturnType<typeof generateSolution>['board'], kind: string) {
  let count = 0;
  for (const row of board) for (const tile of row) if (tile.kind === kind) count++;
  return count;
}

describe('generateSolution', () => {
  it('生成 5×5 棋盘', () => {
    const { board } = generateSolution(mulberry32(42));
    expect(board.length).toBe(ROWS);
    for (const row of board) expect(row.length).toBe(COLS);
  });

  it('恰好一个电源', () => {
    const { board } = generateSolution(mulberry32(42));
    expect(countKind(board, 'power')).toBe(1);
  });

  it('恰好 5 个灯泡', () => {
    const { board } = generateSolution(mulberry32(42));
    expect(countKind(board, 'bulb')).toBe(BULB_COUNT);
  });

  it('灯泡均为树叶（单接口）', () => {
    const { board } = generateSolution(mulberry32(42));
    for (const row of board)
      for (const tile of row)
        if (tile.kind === 'bulb') expect(tile.connections).toHaveLength(1);
  });

  it('非电源格类型与生成树度数匹配', () => {
    const { board } = generateSolution(mulberry32(42));
    for (const row of board)
      for (const tile of row) {
        if (tile.kind === 'power') continue;
        const deg = tile.connections.length;
        if (deg === 1) expect(tile.kind).toBe('bulb');
        else if (deg === 4) expect(tile.kind).toBe('cross');
        else if (deg === 3) expect(tile.kind).toBe('tee');
        else if (deg === 2) {
          const isStraight =
            (tile.connections.includes('N') && tile.connections.includes('S')) ||
            (tile.connections.includes('E') && tile.connections.includes('W'));
          expect(tile.kind).toBe(isStraight ? 'straight' : 'corner');
        }
      }
  });

  it('解状态下所有格可从电源到达', () => {
    const { board } = generateSolution(mulberry32(42));
    const powered = computePowered(board);
    for (const row of powered) for (const p of row) expect(p).toBe(true);
  });

  it('解状态下所有灯泡通电（胜利）', () => {
    const { board } = generateSolution(mulberry32(42));
    expect(checkWin(applyPowered(board))).toBe(true);
  });

  it('多个不同种子均生成有效棋盘', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { board } = generateSolution(mulberry32(seed));
      expect(countKind(board, 'power')).toBe(1);
      expect(countKind(board, 'bulb')).toBe(5);
      const powered = computePowered(board);
      for (const row of powered) for (const p of row) expect(p).toBe(true);
    }
  });

  it('极端随机源下使用梳形保底树且仍有效', () => {
    // 始终返回接近 1 的值，DFS 总选最后一个候选；验证 200 次后保底生效
    const constRng = () => 0.999999;
    const { board } = generateSolution(constRng);
    expect(countKind(board, 'power')).toBe(1);
    expect(countKind(board, 'bulb')).toBe(5);
    const powered = computePowered(board);
    for (const row of powered) for (const p of row) expect(p).toBe(true);
  });
});

describe('shuffleBoard', () => {
  it('不改变电源接口', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng);
    const shuffled = shuffleBoard(solution, rng);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (solution[r][c].kind === 'power')
          expect(shuffled[r][c].connections).toEqual(solution[r][c].connections);
  });

  it('保留每格接口数量', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng);
    const shuffled = shuffleBoard(solution, rng);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        expect(shuffled[r][c].connections.length).toBe(
          solution[r][c].connections.length,
        );
  });

  it('不修改原解棋盘', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng);
    const snapshot = solution.map((row) =>
      row.map((t) => ({ ...t, connections: [...t.connections] })),
    );
    shuffleBoard(solution, rng);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        expect(solution[r][c].connections).toEqual(snapshot[r][c].connections);
  });

  it('解仍然存在（原解棋盘仍可胜利）', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng);
    shuffleBoard(solution, rng);
    expect(checkWin(applyPowered(solution))).toBe(true);
  });

  it('输出不是开局即胜利', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng);
    const shuffled = shuffleBoard(solution, rng);
    expect(checkWin(applyPowered(shuffled))).toBe(false);
  });
});

describe('generateGame', () => {
  it('初始状态非胜利', () => {
    const state = generateGame(mulberry32(99));
    expect(state.won).toBe(false);
  });

  it('initialBoard 与当前棋盘不共享格子对象', () => {
    const state = generateGame(mulberry32(99));
    state.board[0][0].connections.push('N');
    expect(state.initialBoard[0][0].connections).not.toContain('N');
  });

  it('重置后能恢复到 initialBoard 的接口', () => {
    const state = generateGame(mulberry32(99));
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        expect(state.board[r][c].connections).toEqual(
          state.initialBoard[r][c].connections,
        );
  });
});

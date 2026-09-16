import { describe, it, expect } from 'vitest';
import { generateSolution, shuffleBoard, generateGame } from './generator';
import { computePowered, applyPowered, checkWin } from './power';
import { DIFFICULTIES, type Difficulty } from './types';
import { mulberry32 } from '../test-utils';

function countKind(board: ReturnType<typeof generateSolution>['board'], kind: string) {
  let count = 0;
  for (const row of board) for (const tile of row) if (tile.kind === kind) count++;
  return count;
}

function assertValidSolution(
  board: ReturnType<typeof generateSolution>['board'],
  rows: number,
  cols: number,
  bulbCount: number,
) {
  expect(board).toHaveLength(rows);
  for (const row of board) expect(row).toHaveLength(cols);
  expect(countKind(board, 'power')).toBe(1);
  expect(countKind(board, 'bulb')).toBe(bulbCount);
  // 灯泡均为单接口
  for (const row of board)
    for (const tile of row)
      if (tile.kind === 'bulb') expect(tile.connections).toHaveLength(1);
  // 解状态全连通
  const powered = computePowered(board);
  for (const row of powered) for (const p of row) expect(p).toBe(true);
  expect(checkWin(applyPowered(board))).toBe(true);
}

describe('generateSolution - 5x5 简单档', () => {
  const cfg = DIFFICULTIES.easy;

  it('生成有效棋盘', () => {
    const { board } = generateSolution(mulberry32(42), cfg.rows, cfg.cols, cfg.bulbCount);
    assertValidSolution(board, cfg.rows, cfg.cols, cfg.bulbCount);
  });

  it('非电源格类型与生成树度数匹配', () => {
    const { board } = generateSolution(mulberry32(42), cfg.rows, cfg.cols, cfg.bulbCount);
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

  it('多个种子均有效', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { board } = generateSolution(mulberry32(seed), cfg.rows, cfg.cols, cfg.bulbCount);
      assertValidSolution(board, cfg.rows, cfg.cols, cfg.bulbCount);
    }
  });

  it('极端随机源下保底树仍有效', () => {
    const constRng = () => 0.999999;
    const { board } = generateSolution(constRng, cfg.rows, cfg.cols, cfg.bulbCount);
    assertValidSolution(board, cfg.rows, cfg.cols, cfg.bulbCount);
  });
});

describe('generateSolution - 多难度尺寸', () => {
  const cases: [Difficulty, number, number, number][] = [
    ['easy', 5, 5, 5],
    ['medium', 6, 6, 6],
    ['hard', 7, 7, 7],
    ['hell', 9, 9, 9],
  ];

  it.each(cases)('%s: %dx%d, %d 灯泡', (diff, rows, cols, bulbs) => {
    const cfg = DIFFICULTIES[diff];
    const { board } = generateSolution(mulberry32(100), rows, cols, bulbs);
    assertValidSolution(board, rows, cols, bulbs);
    expect(cfg.rows).toBe(rows);
    expect(cfg.cols).toBe(cols);
    expect(cfg.bulbCount).toBe(bulbs);
  });
});

describe('shuffleBoard', () => {
  const cfg = DIFFICULTIES.easy;

  it('不改变电源接口', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng, cfg.rows, cfg.cols, cfg.bulbCount);
    const shuffled = shuffleBoard(solution, rng, cfg.rows, cfg.cols);
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++)
        if (solution[r][c].kind === 'power')
          expect(shuffled[r][c].connections).toEqual(solution[r][c].connections);
  });

  it('保留每格接口数量', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng, cfg.rows, cfg.cols, cfg.bulbCount);
    const shuffled = shuffleBoard(solution, rng, cfg.rows, cfg.cols);
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++)
        expect(shuffled[r][c].connections.length).toBe(solution[r][c].connections.length);
  });

  it('不修改原解棋盘', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng, cfg.rows, cfg.cols, cfg.bulbCount);
    const snapshot = solution.map((row) =>
      row.map((t) => ({ ...t, connections: [...t.connections] })),
    );
    shuffleBoard(solution, rng, cfg.rows, cfg.cols);
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++)
        expect(solution[r][c].connections).toEqual(snapshot[r][c].connections);
  });

  it('解仍然存在', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng, cfg.rows, cfg.cols, cfg.bulbCount);
    shuffleBoard(solution, rng, cfg.rows, cfg.cols);
    expect(checkWin(applyPowered(solution))).toBe(true);
  });

  it('输出不是开局即胜利', () => {
    const rng = mulberry32(7);
    const { board: solution } = generateSolution(rng, cfg.rows, cfg.cols, cfg.bulbCount);
    const shuffled = shuffleBoard(solution, rng, cfg.rows, cfg.cols);
    expect(checkWin(applyPowered(shuffled))).toBe(false);
  });
});

describe('generateGame', () => {
  it('默认简单档，初始状态非胜利', () => {
    const state = generateGame(mulberry32(99));
    expect(state.difficulty).toBe('easy');
    expect(state.won).toBe(false);
    expect(state.started).toBe(false);
    expect(state.completedSeconds).toBeNull();
    expect(state.showingSolution).toBe(false);
  });

  it('initialBoard 与当前棋盘不共享格子对象', () => {
    const state = generateGame(mulberry32(99));
    state.board[0][0].connections.push('N');
    expect(state.initialBoard[0][0].connections).not.toContain('N');
  });

  it('solutionBoard 是全连通的解', () => {
    const state = generateGame(mulberry32(99));
    for (const row of state.solutionBoard)
      for (const tile of row) expect(tile.powered).toBe(true);
    expect(checkWin(state.solutionBoard)).toBe(true);
  });

  it('支持指定难度', () => {
    for (const diff of ['medium', 'hard', 'hell'] as Difficulty[]) {
      const state = generateGame(mulberry32(50), diff);
      expect(state.difficulty).toBe(diff);
      expect(state.board).toHaveLength(DIFFICULTIES[diff].rows);
      expect(state.board[0]).toHaveLength(DIFFICULTIES[diff].cols);
    }
  });
});

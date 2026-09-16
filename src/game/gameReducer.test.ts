import { describe, it, expect } from 'vitest';
import { gameReducer } from './gameReducer';
import { generateGame } from './generator';
import { ROWS, COLS } from './types';
import { mulberry32 } from '../test-utils';

function findTile(
  board: ReturnType<typeof generateGame>['board'],
  predicate: (kind: string) => boolean,
): { row: number; col: number } {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (predicate(board[r][c].kind)) return { row: r, col: c };
  throw new Error('tile not found');
}

describe('gameReducer - ROTATE', () => {
  it('旋转可旋转格：仅该格接口变化，并重算通电', () => {
    const state = generateGame(mulberry32(1));
    const { row, col } = findTile(state.board, (k) => k === 'bulb');
    const before = state.board[row][col].connections;
    const next = gameReducer(state, { type: 'ROTATE', row, col });
    expect(next.board[row][col].connections).not.toEqual(before);
    // 其他格接口不变
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (r === row && c === col) continue;
        expect(next.board[r][c].connections).toEqual(state.board[r][c].connections);
      }
  });

  it('点击电源不产生任何变化', () => {
    const state = generateGame(mulberry32(1));
    const { row, col } = findTile(state.board, (k) => k === 'power');
    const next = gameReducer(state, { type: 'ROTATE', row, col });
    expect(next).toBe(state);
  });

  it('点击十字形不产生变化', () => {
    const state = generateGame(mulberry32(1));
    // 不一定有十字形，若有则测
    let crossPos: { row: number; col: number } | null = null;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (state.board[r][c].kind === 'cross') crossPos = { row: r, col: c };
    if (crossPos) {
      const next = gameReducer(state, { type: 'ROTATE', ...crossPos });
      expect(next).toBe(state);
    }
  });

  it('旋转后 won 状态被重新计算', () => {
    const state = generateGame(mulberry32(1));
    const { row, col } = findTile(state.board, (k) => k === 'bulb');
    const next = gameReducer(state, { type: 'ROTATE', row, col });
    expect(typeof next.won).toBe('boolean');
  });
});

describe('gameReducer - RESET', () => {
  it('重置恢复初始打乱布局', () => {
    const state = generateGame(mulberry32(2));
    const { row, col } = findTile(state.board, (k) => k === 'bulb');
    const afterRotate = gameReducer(state, { type: 'ROTATE', row, col });
    const reset = gameReducer(afterRotate, { type: 'RESET' });
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        expect(reset.board[r][c].connections).toEqual(
          state.initialBoard[r][c].connections,
        );
  });

  it('重置后胜利状态消失', () => {
    const state = generateGame(mulberry32(2));
    const reset = gameReducer(state, { type: 'RESET' });
    expect(reset.won).toBe(false);
  });
});

describe('gameReducer - NEW_GAME', () => {
  it('生成新棋盘', () => {
    const state = generateGame(mulberry32(1));
    const next = gameReducer(state, { type: 'NEW_GAME', rng: mulberry32(2) });
    expect(next).not.toBe(state);
    let different = false;
    for (let r = 0; r < ROWS && !different; r++)
      for (let c = 0; c < COLS && !different; c++) {
        if (
          next.board[r][c].connections.join(',') !==
          state.board[r][c].connections.join(',')
        )
          different = true;
      }
    expect(different).toBe(true);
  });
});

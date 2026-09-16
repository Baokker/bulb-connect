import { describe, it, expect } from 'vitest';
import { gameReducer } from './gameReducer';
import { generateGame } from './generator';
import { DIFFICULTIES } from './types';
import { mulberry32 } from '../test-utils';

function findTile(
  board: ReturnType<typeof generateGame>['board'],
  predicate: (kind: string) => boolean,
): { row: number; col: number } {
  for (let r = 0; r < board.length; r++)
    for (let c = 0; c < board[r].length; c++)
      if (predicate(board[r][c].kind)) return { row: r, col: c };
  throw new Error('tile not found');
}

describe('gameReducer - ROTATE', () => {
  it('开始后旋转可旋转格：仅该格接口变化', () => {
    let state = generateGame(mulberry32(1));
    state = gameReducer(state, { type: 'START' });
    const { row, col } = findTile(state.board, (k) => k === 'bulb');
    const before = state.board[row][col].connections;
    const next = gameReducer(state, { type: 'ROTATE', row, col });
    expect(next.board[row][col].connections).not.toEqual(before);
  });

  it('未开始时旋转无效', () => {
    const state = generateGame(mulberry32(1));
    expect(state.started).toBe(false);
    const { row, col } = findTile(state.board, (k) => k === 'bulb');
    const next = gameReducer(state, { type: 'ROTATE', row, col });
    expect(next).toBe(state);
  });

  it('点击电源不产生变化', () => {
    let state = generateGame(mulberry32(1));
    state = gameReducer(state, { type: 'START' });
    const { row, col } = findTile(state.board, (k) => k === 'power');
    const next = gameReducer(state, { type: 'ROTATE', row, col });
    expect(next).toBe(state);
  });

  it('胜利后旋转无效', () => {
    let state = generateGame(mulberry32(1));
    state = gameReducer(state, { type: 'START' });
    // 直接设为胜利状态
    state = { ...state, won: true };
    const { row, col } = findTile(state.board, (k) => k === 'bulb');
    const next = gameReducer(state, { type: 'ROTATE', row, col });
    expect(next).toBe(state);
  });
});

describe('gameReducer - START', () => {
  it('开始后 started 变为 true', () => {
    const state = generateGame(mulberry32(1));
    const next = gameReducer(state, { type: 'START' });
    expect(next.started).toBe(true);
  });

  it('重复开始不产生变化', () => {
    let state = generateGame(mulberry32(1));
    state = gameReducer(state, { type: 'START' });
    const next = gameReducer(state, { type: 'START' });
    expect(next).toBe(state);
  });
});

describe('gameReducer - COMPLETE', () => {
  it('胜利时记录完成时间', () => {
    let state = generateGame(mulberry32(1));
    state = { ...state, won: true };
    const next = gameReducer(state, { type: 'COMPLETE', seconds: 42 });
    expect(next.completedSeconds).toBe(42);
  });

  it('未胜利时 COMPLETE 无效', () => {
    const state = generateGame(mulberry32(1));
    const next = gameReducer(state, { type: 'COMPLETE', seconds: 42 });
    expect(next).toBe(state);
  });

  it('显示答案时 COMPLETE 无效', () => {
    let state = generateGame(mulberry32(1));
    state = { ...state, won: true, showingSolution: true };
    const next = gameReducer(state, { type: 'COMPLETE', seconds: 42 });
    expect(next).toBe(state);
  });
});

describe('gameReducer - RESET', () => {
  it('重置恢复初始布局并清空计时状态', () => {
    let state = generateGame(mulberry32(2));
    state = gameReducer(state, { type: 'START' });
    const { row, col } = findTile(state.board, (k) => k === 'bulb');
    state = gameReducer(state, { type: 'ROTATE', row, col });
    const reset = gameReducer(state, { type: 'RESET' });
    for (let r = 0; r < reset.board.length; r++)
      for (let c = 0; c < reset.board[r].length; c++)
        expect(reset.board[r][c].connections).toEqual(
          state.initialBoard[r][c].connections,
        );
    expect(reset.started).toBe(false);
    expect(reset.won).toBe(false);
    expect(reset.completedSeconds).toBeNull();
    expect(reset.showingSolution).toBe(false);
  });
});

describe('gameReducer - NEW_GAME', () => {
  it('生成新棋盘', () => {
    const state = generateGame(mulberry32(1));
    const next = gameReducer(state, { type: 'NEW_GAME', rng: mulberry32(2) });
    expect(next).not.toBe(state);
  });

  it('可切换难度', () => {
    const state = generateGame(mulberry32(1), 'easy');
    const next = gameReducer(state, { type: 'NEW_GAME', difficulty: 'hard' });
    expect(next.difficulty).toBe('hard');
    expect(next.board).toHaveLength(DIFFICULTIES.hard.rows);
  });
});

describe('gameReducer - SHOW_SOLUTION', () => {
  it('显示答案：棋盘变为解状态，标记 showingSolution', () => {
    const state = generateGame(mulberry32(1));
    const next = gameReducer(state, { type: 'SHOW_SOLUTION' });
    expect(next.showingSolution).toBe(true);
    expect(next.won).toBe(true);
    expect(next.started).toBe(false);
    // 解状态全通电
    for (const row of next.board)
      for (const tile of row) expect(tile.powered).toBe(true);
  });

  it('重复显示答案不产生变化', () => {
    let state = generateGame(mulberry32(1));
    state = gameReducer(state, { type: 'SHOW_SOLUTION' });
    const next = gameReducer(state, { type: 'SHOW_SOLUTION' });
    expect(next).toBe(state);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { generateGame } from './game/generator';
import type { GameState, Board, Tile, TileKind } from './game/types';

vi.mock('./game/generator', () => ({
  generateGame: vi.fn(),
}));

const mockedGenerateGame = vi.mocked(generateGame);

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = {
    board: Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 5 }, (_, c) => ({
        id: `t-${r}-${c}`,
        kind:
          r === 2 && c === 2
            ? 'power'
            : c === 4
              ? 'bulb'
              : 'straight',
        connections: ['N', 'E', 'S', 'W'] as const,
        powered: true,
      })),
    ),
    initialBoard: [],
    won: false,
  };
  return { ...base, ...overrides } as GameState;
}

describe('App', () => {
  it('渲染标题、棋盘和控制按钮', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    expect(screen.getByText('连灯泡')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新游戏' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
    expect(document.querySelectorAll('.tile')).toHaveLength(25);
  });

  it('胜利时显示胜利提示', () => {
    mockedGenerateGame.mockReturnValue(makeState({ won: true }));
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('胜利');
  });

  it('未胜利时不显示胜利提示', () => {
    mockedGenerateGame.mockReturnValue(makeState({ won: false }));
    render(<App />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('点击新游戏调用 generateGame 生成新棋盘', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '新游戏' }));
    expect(mockedGenerateGame).toHaveBeenCalled();
  });

  it('点击重置不崩溃且保持 25 格', () => {
    const state = makeState();
    // initialBoard 需要有内容才能重置
    state.initialBoard = state.board.map((row) =>
      row.map((t) => ({ ...t, connections: [...t.connections] })),
    );
    mockedGenerateGame.mockReturnValue(state);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '重置' }));
    expect(document.querySelectorAll('.tile')).toHaveLength(25);
  });

  it('点击灯泡格后接口旋转，通电状态同步变化', () => {
    // 手动构造：电源(0,0) E -> 灯泡(0,1) W，灯泡已通电
    const board: Board = Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 5 }, (_, c): Tile => {
        const kind: TileKind =
          r === 0 && c === 0 ? 'power' : r === 0 && c === 1 ? 'bulb' : 'straight';
        return {
          id: `t-${r}-${c}`,
          kind,
          connections: ['N', 'E', 'S', 'W'],
          powered: false,
        };
      }),
    );
    board[0][0].connections = ['E'];
    board[0][0].powered = true;
    board[0][1].connections = ['W'];
    board[0][1].powered = true;
    const state: GameState = {
      board,
      initialBoard: board.map((row) =>
        row.map((t) => ({ ...t, connections: [...t.connections] })),
      ),
      won: false,
    };
    mockedGenerateGame.mockReturnValue(state);

    render(<App />);
    // 点击前：灯泡已通电
    expect(
      screen.getByLabelText('第 1 行第 2 列，灯泡，已通电'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('第 1 行第 2 列，灯泡，已通电'));

    // 点击后：灯泡从 W 旋到 N，与电源断开，变为未通电
    expect(
      screen.getByLabelText('第 1 行第 2 列，灯泡，未通电'),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('第 1 行第 2 列，灯泡，已通电'),
    ).not.toBeInTheDocument();
  });
});

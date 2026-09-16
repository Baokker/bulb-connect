import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { generateGame } from './game/generator';
import type { GameState, Board, Tile, TileKind } from './game/types';
import { starsForTime, formatTime } from './game/types';

vi.mock('./game/generator', () => ({
  generateGame: vi.fn(),
}));

const mockedGenerateGame = vi.mocked(generateGame);

function makeBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c): Tile => {
      const kind: TileKind =
        r === 0 && c === 0 ? 'power' : r === 0 && c === 1 ? 'bulb' : 'straight';
      return {
        id: `t-${r}-${c}`,
        kind,
        connections: ['N', 'E', 'S', 'W'],
        powered: true,
      };
    }),
  );
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  const board = makeBoard(5, 5);
  return {
    board,
    initialBoard: board.map((row) =>
      row.map((t) => ({ ...t, connections: [...t.connections] })),
    ),
    solutionBoard: board.map((row) =>
      row.map((t) => ({ ...t, connections: [...t.connections] })),
    ),
    won: false,
    difficulty: 'easy',
    started: false,
    completedSeconds: null,
    showingSolution: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('App - 基础渲染', () => {
  it('渲染标题、棋盘和控制区', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    expect(screen.getByText('连灯泡')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新游戏' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '显示答案' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '开始游戏' })).toBeInTheDocument();
    expect(document.querySelectorAll('.tile')).toHaveLength(25);
  });

  it('显示难度选择按钮', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    expect(screen.getByRole('button', { name: '简单' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '中等' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '困难' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '地狱' })).toBeInTheDocument();
  });

  it('未开始时显示提示且格子禁用', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    expect(screen.getByText(/点击「开始游戏」/)).toBeInTheDocument();
    const tileBtns = screen.getAllByRole('button').filter(
      (b) => b.classList.contains('tile'),
    );
    for (const btn of tileBtns) expect(btn).toBeDisabled();
  });
});

describe('App - 开始与计时', () => {
  it('点击开始后启用格子', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(screen.queryByRole('button', { name: '开始游戏' })).not.toBeInTheDocument();
    const tileBtns = screen.getAllByRole('button').filter(
      (b) => b.classList.contains('tile'),
    );
    for (const btn of tileBtns) expect(btn).not.toBeDisabled();
  });
});

describe('App - 胜利与星级', () => {
  it('胜利时显示用时和星级', () => {
    mockedGenerateGame.mockReturnValue(
      makeState({ won: true, started: true, completedSeconds: 30 }),
    );
    render(<App />);
    expect(screen.getByText('胜利！')).toBeInTheDocument();
    expect(screen.getByText(/用时 0:30/)).toBeInTheDocument();
    // 30秒 <= 60秒 = 3星
    expect(document.querySelector('.star-bright')?.textContent).toBe('★★★');
  });

  it('超过三★阈值但未超二★阈值显示2星', () => {
    mockedGenerateGame.mockReturnValue(
      makeState({ won: true, started: true, completedSeconds: 90 }),
    );
    render(<App />);
    // 90秒: >60 (3星阈值), <=120 (2星阈值) = 2星
    expect(document.querySelector('.star-bright')?.textContent).toBe('★★');
  });

  it('超过二★阈值显示1星', () => {
    mockedGenerateGame.mockReturnValue(
      makeState({ won: true, started: true, completedSeconds: 200 }),
    );
    render(<App />);
    // 200秒 > 120 = 1星
    expect(document.querySelector('.star-bright')?.textContent).toBe('★');
  });
});

describe('App - 显示答案', () => {
  it('点击显示答案弹出确认框', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '显示答案' }));
    expect(screen.getByText('查看参考答案？')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看答案' })).toBeInTheDocument();
  });

  it('确认后显示答案横幅', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '显示答案' }));
    fireEvent.click(screen.getByRole('button', { name: '查看答案' }));
    expect(screen.getByText('参考答案')).toBeInTheDocument();
    expect(screen.getByText(/不计星级/)).toBeInTheDocument();
  });

  it('取消后不显示答案', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '显示答案' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.queryByText('参考答案')).not.toBeInTheDocument();
  });
});

describe('App - 重置确认', () => {
  it('点击重置弹出确认框', () => {
    mockedGenerateGame.mockReturnValue(makeState({ started: true }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '重置' }));
    expect(screen.getByText('确认重置？')).toBeInTheDocument();
  });

  it('未开始时重置按钮禁用', () => {
    mockedGenerateGame.mockReturnValue(makeState());
    render(<App />);
    expect(screen.getByRole('button', { name: '重置' })).toBeDisabled();
  });
});

describe('starsForTime', () => {
  it('简单档：≤60秒3星，≤120秒2星，其他1星', () => {
    expect(starsForTime('easy', 60)).toBe(3);
    expect(starsForTime('easy', 61)).toBe(2);
    expect(starsForTime('easy', 120)).toBe(2);
    expect(starsForTime('easy', 121)).toBe(1);
  });

  it('地狱档：≤300秒3星，≤600秒2星', () => {
    expect(starsForTime('hell', 300)).toBe(3);
    expect(starsForTime('hell', 301)).toBe(2);
    expect(starsForTime('hell', 600)).toBe(2);
    expect(starsForTime('hell', 601)).toBe(1);
  });
});

describe('formatTime', () => {
  it('格式化秒为 m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(125)).toBe('2:05');
  });
});

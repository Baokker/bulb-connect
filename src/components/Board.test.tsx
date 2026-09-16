import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Board } from './Board';
import { generateGame } from '../game/generator';
import { mulberry32 } from '../test-utils';

describe('Board', () => {
  it('渲染正确数量的格子', () => {
    const state = generateGame(mulberry32(5));
    render(<Board board={state.board} onRotate={() => {}} />);
    expect(document.querySelectorAll('.tile')).toHaveLength(25);
  });

  it('非电源格为按钮，电源格为静态元素', () => {
    const state = generateGame(mulberry32(5));
    render(<Board board={state.board} onRotate={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(24);
    expect(document.querySelectorAll('.power-tile')).toHaveLength(1);
  });

  it('点击格子触发 onRotate', () => {
    const state = generateGame(mulberry32(5));
    const onRotate = vi.fn();
    render(<Board board={state.board} onRotate={onRotate} />);
    const firstBtn = screen.getAllByRole('button')[0];
    fireEvent.click(firstBtn);
    expect(onRotate).toHaveBeenCalledTimes(1);
  });

  it('disabled 时所有按钮不可点击', () => {
    const state = generateGame(mulberry32(5));
    const onRotate = vi.fn();
    render(<Board board={state.board} disabled onRotate={onRotate} />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }
    fireEvent.click(buttons[0]);
    expect(onRotate).not.toHaveBeenCalled();
  });

  it('每个格子有描述性可访问名称', () => {
    const state = generateGame(mulberry32(5));
    render(<Board board={state.board} onRotate={() => {}} />);
    const tiles = document.querySelectorAll('.tile');
    for (const tile of tiles) {
      const label = tile.getAttribute('aria-label');
      expect(label).toMatch(/第 \d+ 行第 \d+ 列/);
    }
  });

  it('支持更大尺寸棋盘（6x6）', () => {
    const state = generateGame(mulberry32(5), 'medium');
    render(<Board board={state.board} onRotate={() => {}} />);
    expect(document.querySelectorAll('.tile')).toHaveLength(36);
  });
});

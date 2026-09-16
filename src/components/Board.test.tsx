import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Board } from './Board';
import { generateGame } from '../game/generator';
import { mulberry32 } from '../test-utils';

describe('Board', () => {
  it('渲染 25 个格子', () => {
    const state = generateGame(mulberry32(5));
    render(<Board board={state.board} onRotate={() => {}} />);
    expect(document.querySelectorAll('.tile')).toHaveLength(25);
  });

  it('非电源格渲染为可点击按钮，电源格为静态元素', () => {
    const state = generateGame(mulberry32(5));
    render(<Board board={state.board} onRotate={() => {}} />);
    // 24 个非电源格是 button
    expect(screen.getAllByRole('button')).toHaveLength(24);
    // 电源格是 div（role=img）
    expect(document.querySelectorAll('.power-tile')).toHaveLength(1);
  });

  it('点击格子触发 onRotate 并传入行列', () => {
    const state = generateGame(mulberry32(5));
    const onRotate = vi.fn();
    render(<Board board={state.board} onRotate={onRotate} />);
    const firstBtn = screen.getAllByRole('button')[0];
    fireEvent.click(firstBtn);
    expect(onRotate).toHaveBeenCalledTimes(1);
    const [r, c] = onRotate.mock.calls[0];
    expect(r).toBeGreaterThanOrEqual(0);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(5);
    expect(c).toBeLessThan(5);
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
});

import { describe, it, expect } from 'vitest';
import {
  opposite,
  rotateClockwise,
  rotateConnectionsClockwise,
  DIRECTIONS,
} from './directions';

describe('opposite', () => {
  it('N 的相反方向是 S', () => expect(opposite('N')).toBe('S'));
  it('E 的相反方向是 W', () => expect(opposite('E')).toBe('W'));
  it('S 的相反方向是 N', () => expect(opposite('S')).toBe('N'));
  it('W 的相反方向是 E', () => expect(opposite('W')).toBe('E'));
});

describe('rotateClockwise', () => {
  it('N 顺时针旋转为 E', () => expect(rotateClockwise('N')).toBe('E'));
  it('E 顺时针旋转为 S', () => expect(rotateClockwise('E')).toBe('S'));
  it('S 顺时针旋转为 W', () => expect(rotateClockwise('S')).toBe('W'));
  it('W 顺时针旋转为 N', () => expect(rotateClockwise('W')).toBe('N'));

  it('连续四次旋转回到原方向', () => {
    for (const d of DIRECTIONS) {
      let cur = d;
      for (let i = 0; i < 4; i++) cur = rotateClockwise(cur);
      expect(cur).toBe(d);
    }
  });
});

describe('rotateConnectionsClockwise', () => {
  it('旋转数组中所有方向', () => {
    expect(rotateConnectionsClockwise(['N', 'E'])).toEqual(['E', 'S']);
  });

  it('空数组返回空数组', () => {
    expect(rotateConnectionsClockwise([])).toEqual([]);
  });
});
